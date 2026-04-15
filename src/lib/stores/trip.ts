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

// ─── Derived ──────────────────────────────────────────────────────────────────

export const daysByLocation = derived([locations, days], ([$locations, $days]) =>
  $locations.map((loc) => ({
    location: loc,
    days: $days.filter((d) => d.locationId === loc.id)
  }))
);

export const maybeList = derived(activities, ($activities) =>
  $activities.filter((a) => a.section === 'maybe').sort((a, b) => a.order - b.order)
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
