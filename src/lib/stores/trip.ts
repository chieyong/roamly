import { writable, derived, get } from 'svelte/store';
import type { Trip, Location, Day, Activity, Section } from '$lib/types';
import {
  mockTrip,
  mockLocations,
  mockDays,
  mockActivities
} from '$lib/data/mockData';

// ─── Raw stores ───────────────────────────────────────────────────────────────

export const trip = writable<Trip>(mockTrip);
export const locations = writable<Location[]>(mockLocations);
export const days = writable<Day[]>(mockDays);
export const activities = writable<Activity[]>(mockActivities);

// ─── Derived: days grouped by location ───────────────────────────────────────

export const daysByLocation = derived([locations, days], ([$locations, $days]) => {
  return $locations.map((loc) => ({
    location: loc,
    days: $days.filter((d) => d.locationId === loc.id)
  }));
});

// ─── Derived: maybe list ──────────────────────────────────────────────────────

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
}

export function addActivity(activity: Activity) {
  activities.update((all) => [...all, activity]);
}

export function deleteActivity(id: string) {
  activities.update((all) => all.filter((a) => a.id !== id));
}

export function moveActivity(
  activityId: string,
  toDayId: string,
  toSection: Section,
  newOrder: number
) {
  activities.update((all) => {
    const idx = all.findIndex((a) => a.id === activityId);
    if (idx === -1) return all;
    const updated = [...all];
    updated[idx] = { ...updated[idx], dayId: toDayId, section: toSection, order: newOrder };
    return updated;
  });
}

export function reorderSection(dayId: string, section: Section, orderedIds: string[]) {
  activities.update((all) => {
    return all.map((a) => {
      if (a.dayId === dayId && a.section === section) {
        const newOrder = orderedIds.indexOf(a.id);
        return newOrder !== -1 ? { ...a, order: newOrder } : a;
      }
      return a;
    });
  });
}

let _nextId = 100;
export function generateId(): string {
  return `act-${Date.now()}-${_nextId++}`;
}
