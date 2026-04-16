import { writable, derived, get } from 'svelte/store';
import type { Trip, Location, Day, Activity, Section } from '$lib/types';
import { mockTrip, mockLocations, mockDays, mockActivities } from '$lib/data/mockData';

// ─── Raw stores ───────────────────────────────────────────────────────────────

export const trip      = writable<Trip>(mockTrip);
export const locations = writable<Location[]>(mockLocations);
export const days      = writable<Day[]>(mockDays);
export const activities = writable<Activity[]>(mockActivities);

// ─── Firestore sync (lazy import — only runs client-side when logged in) ──────

let _firestoreUid: string | null = null;

export function enableFirestoreSync(uid: string) {
  if (_firestoreUid === uid) return; // already listening
  _firestoreUid = uid;

  // Lazy-import to avoid SSR issues
  import('$lib/firebase/firestore').then(({ subscribeActivities, saveActivity, deleteActivity: fsDeleteActivity, saveTrip, subscribeDays, db }) => {
    import('firebase/firestore').then(({ collection, onSnapshot, query, where, orderBy }) => {

      // ── Listen to all activities for this user ──────────────────────────
      // We listen across all days so the local store stays in sync
      const actCol = collection(db, 'users', uid, 'activities');
      onSnapshot(actCol, (snap) => {
        const remote = snap.docs.map((d) => d.data() as Activity);
        if (remote.length > 0) {
          activities.set(remote);
        }
      });

    });

    // ── Push local activity mutations to Firestore ──────────────────────
    activities.subscribe((all) => {
      if (!_firestoreUid) return;
      all.forEach((a) => saveActivity(_firestoreUid!, a));
    });

  }).catch(() => {/* Firebase not configured yet */});
}

export function disableFirestoreSync() {
  _firestoreUid = null;
}

// ─── Trip mutations ────────────────────────────────────────────────────────────

export function updateDay(dayId: string, patch: Partial<Day>) {
  let updated: Day | undefined;
  days.update((all) => all.map((d) => {
    if (d.id !== dayId) return d;
    updated = { ...d, ...patch };
    return updated;
  }));
  if (_firestoreUid && updated) {
    import('$lib/firebase/firestore').then(({ saveDay }) => saveDay(_firestoreUid!, updated!));
  }
}

export function updateTrip(patch: Partial<Trip>) {
  trip.update((t) => {
    const updated = { ...t, ...patch };
    if (_firestoreUid) {
      import('$lib/firebase/firestore').then(({ saveTrip }) => {
        saveTrip(_firestoreUid!, updated);
      });
    }
    return updated;
  });
}

// ─── Derived ──────────────────────────────────────────────────────────────────

export const daysByLocation = derived([locations, days], ([$locations, $days]) =>
  // Always sort by startDate so display order is correct regardless of store insertion order
  [...$locations]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((loc) => ({
      location: loc,
      days: $days.filter((d) => d.locationId === loc.id)
    }))
);

export const maybeList = derived(activities, ($activities) =>
  $activities.filter((a) => a.section === 'maybe').sort((a, b) => a.order - b.order)
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD using LOCAL date parts (avoids UTC timezone shift). */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getActivitiesForDay(dayId: string) {
  return derived(activities, ($activities) =>
    $activities
      .filter((a) => a.dayId === dayId && a.section !== 'maybe')
      .sort((a, b) => a.order - b.order)
  );
}

export function getActivitiesForSection(dayId: string, section: Section) {
  return derived(activities, ($activities) =>
    $activities
      .filter((a) => a.dayId === dayId && a.section === section)
      .sort((a, b) => a.order - b.order)
  );
}

export function getDayById(id: string) {
  return get(days).find((d) => d.id === id);
}

export function getLocationById(id: string) {
  return get(locations).find((l) => l.id === id);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function updateActivity(updated: Activity) {
  activities.update((all) => all.map((a) => (a.id === updated.id ? updated : a)));
  if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ saveActivity }) => saveActivity(_firestoreUid!, updated));
  }
}

export function addActivity(activity: Activity) {
  activities.update((all) => [...all, activity]);
  if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ saveActivity }) => saveActivity(_firestoreUid!, activity));
  }
}

export function deleteActivity(id: string) {
  activities.update((all) => all.filter((a) => a.id !== id));
  if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ deleteActivity: fsDel }) => fsDel(_firestoreUid!, id));
  }
}

export function moveActivity(activityId: string, toDayId: string, toSection: Section, newOrder: number) {
  let moved: Activity | undefined;
  activities.update((all) => {
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) return all;
    const updated = [...all];
    moved = { ...updated[idx], dayId: toDayId, section: toSection, order: newOrder };
    updated[idx] = moved;
    return updated;
  });
  if (_firestoreUid && moved) {
    import('$lib/firebase/firestore').then(({ saveActivity }) => saveActivity(_firestoreUid!, moved!));
  }
}

export function reorderSection(dayId: string, section: Section, orderedIds: string[]) {
  const reordered: Activity[] = [];
  activities.update((all) => {
    const result = all.map((a) => {
      if (a.dayId === dayId && a.section === section) {
        const newOrder = orderedIds.indexOf(a.id);
        const updated = newOrder !== -1 ? { ...a, order: newOrder } : a;
        if (newOrder !== -1) reordered.push(updated);
        return updated;
      }
      return a;
    });
    return result;
  });
  if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ saveActivity }) => {
      reordered.forEach((a) => saveActivity(_firestoreUid!, a));
    });
  }
}

let _nextId = 100;
export function generateId(): string {
  return `act-${Date.now()}-${_nextId++}`;
}

// ─── Location mutations ───────────────────────────────────────────────────────

/** Generate Day objects for a location's date range (startDate inclusive, endDate exclusive). */
function generateDaysForLocation(loc: Location): Day[] {
  const tripId = get(trip).id;
  const result: Day[] = [];
  const end = new Date(loc.endDate + 'T00:00:00');
  let cur = new Date(loc.startDate + 'T00:00:00');
  while (cur < end) {
    const dateStr = localDateStr(cur);
    result.push({ id: `day-${loc.id}-${dateStr}`, tripId, locationId: loc.id, date: dateStr });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/**
 * Resolve date overlaps between locations.
 * The location with `priorityId` keeps its dates unchanged.
 * All subsequent locations that overlap are shifted forward,
 * preserving their original duration.
 * Also updates the trip's end date if locations extend beyond it.
 */
function resolveConflicts(priorityId: string) {
  // Sort so that the priority location wins ties in startDate
  const sorted = [...get(locations)].sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    return a.id === priorityId ? -1 : b.id === priorityId ? 1 : 0;
  });

  if (sorted.length <= 1) return;

  const resolved: Location[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = resolved[resolved.length - 1];
    const curr = { ...sorted[i] };

    if (curr.startDate < prev.endDate) {
      // Overlap — shift curr forward, preserving its duration
      const origDuration = Math.max(1,
        Math.round(
          (new Date(curr.endDate   + 'T00:00:00').getTime() -
           new Date(curr.startDate + 'T00:00:00').getTime()) / 86400000
        )
      );
      curr.startDate = prev.endDate;
      const newEnd = new Date(new Date(curr.startDate + 'T00:00:00').getTime() + origDuration * 86400000);
      curr.endDate = localDateStr(newEnd);
    }

    resolved.push(curr);
  }

  // Only touch locations that actually changed
  const changed = resolved.filter((r) => {
    const orig = sorted.find((l) => l.id === r.id)!;
    return orig.startDate !== r.startDate || orig.endDate !== r.endDate;
  });

  if (changed.length === 0) return;

  // Batch-update the locations store
  locations.update((all) =>
    all.map((l) => changed.find((c) => c.id === l.id) ?? l)
       .sort((a, b) => a.startDate.localeCompare(b.startDate))
  );

  // Regenerate days for every changed location
  for (const loc of changed) {
    const oldDayIds = get(days).filter((d) => d.locationId === loc.id).map((d) => d.id);
    days.update((all) => all.filter((d) => d.locationId !== loc.id));
    const newDays = generateDaysForLocation(loc);
    days.update((all) => [...all, ...newDays].sort((a, b) => a.date.localeCompare(b.date)));

    if (_firestoreUid) {
      import('$lib/firebase/firestore').then(({ saveLocation, saveDay, deleteDay }) => {
        saveLocation(_firestoreUid!, loc);
        oldDayIds.forEach((id) => deleteDay(_firestoreUid!, id));
        newDays.forEach((d) => saveDay(_firestoreUid!, d));
      });
    }
  }

  // Extend the trip's end date if the last location now overshoots it
  const lastLoc = resolved[resolved.length - 1];
  if (lastLoc.endDate > get(trip).endDate) {
    trip.update((t) => ({ ...t, endDate: lastLoc.endDate }));
    if (_firestoreUid) {
      import('$lib/firebase/firestore').then(({ saveTrip }) => {
        saveTrip(_firestoreUid!, get(trip));
      });
    }
  }
}

export function addLocation(location: Location) {
  locations.update((all) =>
    [...all, location].sort((a, b) => a.startDate.localeCompare(b.startDate))
  );
  // Generate initial days before conflict resolution
  const newDays = generateDaysForLocation(location);
  days.update((all) =>
    [...all, ...newDays].sort((a, b) => a.date.localeCompare(b.date))
  );
  if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ saveLocation, saveDay }) => {
      saveLocation(_firestoreUid!, location);
      newDays.forEach((d) => saveDay(_firestoreUid!, d));
    });
  }
  // Resolve any overlaps caused by the new location
  resolveConflicts(location.id);
}

export function updateLocation(updated: Location) {
  const old = get(locations).find((l) => l.id === updated.id);
  locations.update((all) =>
    all.map((l) => (l.id === updated.id ? updated : l))
       .sort((a, b) => a.startDate.localeCompare(b.startDate))
  );
  if (old && (old.startDate !== updated.startDate || old.endDate !== updated.endDate)) {
    // Regenerate days for the edited location itself
    const oldDayIds = get(days).filter((d) => d.locationId === updated.id).map((d) => d.id);
    days.update((all) => all.filter((d) => d.locationId !== updated.id));
    const newDays = generateDaysForLocation(updated);
    days.update((all) =>
      [...all, ...newDays].sort((a, b) => a.date.localeCompare(b.date))
    );
    if (_firestoreUid) {
      import('$lib/firebase/firestore').then(({ saveLocation, saveDay, deleteDay }) => {
        saveLocation(_firestoreUid!, updated);
        oldDayIds.forEach((id) => deleteDay(_firestoreUid!, id));
        newDays.forEach((d) => saveDay(_firestoreUid!, d));
      });
    }
  } else if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ saveLocation }) => {
      saveLocation(_firestoreUid!, updated);
    });
  }
  // Resolve downstream conflicts
  resolveConflicts(updated.id);
}

export function removeLocation(locationId: string) {
  const locDays = get(days).filter((d) => d.locationId === locationId);
  const locDayIds = new Set(locDays.map((d) => d.id));
  // Move activities to maybe rather than deleting them
  activities.update((all) =>
    all.map((a) =>
      locDayIds.has(a.dayId) ? { ...a, dayId: 'maybe', section: 'maybe' as const } : a
    )
  );
  days.update((all) => all.filter((d) => d.locationId !== locationId));
  locations.update((all) => all.filter((l) => l.id !== locationId));
  if (_firestoreUid) {
    import('$lib/firebase/firestore').then(({ deleteLocationDoc, deleteDay }) => {
      deleteLocationDoc(_firestoreUid!, locationId);
      locDays.forEach((d) => deleteDay(_firestoreUid!, d.id));
    });
  }
}
