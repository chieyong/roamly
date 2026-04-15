/**
 * Firestore data layer — mirrors the existing trip store structure.
 * Collections:
 *   users/{uid}/trips/{tripId}
 *   users/{uid}/days/{dayId}
 *   users/{uid}/activities/{activityId}
 *
 * All writes are scoped to the authenticated user so no one can
 * read or modify another user's data (enforce via Firestore rules).
 */
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { app } from './config';
import type { Trip, Day, Activity } from '$lib/types';

export const db = getFirestore(app);

// ── Helpers ───────────────────────────────────────────────────────────────

function userRef(uid: string) {
  return doc(db, 'users', uid);
}

function tripsCol(uid: string) {
  return collection(db, 'users', uid, 'trips');
}

function daysCol(uid: string) {
  return collection(db, 'users', uid, 'days');
}

function activitiesCol(uid: string) {
  return collection(db, 'users', uid, 'activities');
}

// ── Trips ─────────────────────────────────────────────────────────────────

export async function saveTrip(uid: string, trip: Trip) {
  await setDoc(doc(tripsCol(uid), trip.id), trip);
}

export async function deleteTrip(uid: string, tripId: string) {
  await deleteDoc(doc(tripsCol(uid), tripId));
}

export function subscribeTrips(uid: string, cb: (trips: Trip[]) => void): Unsubscribe {
  return onSnapshot(tripsCol(uid), (snap) => {
    cb(snap.docs.map((d) => d.data() as Trip));
  });
}

// ── Days ──────────────────────────────────────────────────────────────────

export async function saveDay(uid: string, day: Day) {
  await setDoc(doc(daysCol(uid), day.id), day);
}

export async function deleteDay(uid: string, dayId: string) {
  await deleteDoc(doc(daysCol(uid), dayId));
}

export function subscribeDays(
  uid: string,
  tripId: string,
  cb: (days: Day[]) => void
): Unsubscribe {
  const q = query(daysCol(uid), where('tripId', '==', tripId), orderBy('date'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Day));
  });
}

// ── Activities ────────────────────────────────────────────────────────────

export async function saveActivity(uid: string, activity: Activity) {
  await setDoc(doc(activitiesCol(uid), activity.id), activity);
}

export async function deleteActivity(uid: string, activityId: string) {
  await deleteDoc(doc(activitiesCol(uid), activityId));
}

export function subscribeActivities(
  uid: string,
  dayId: string,
  cb: (activities: Activity[]) => void
): Unsubscribe {
  const q = query(activitiesCol(uid), where('dayId', '==', dayId), orderBy('order'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Activity));
  });
}

// ── Sharing ───────────────────────────────────────────────────────────────
// A shared trip is stored as a top-level document at /shared/{shareId}.
// The share document contains a snapshot of the trip + all its data.

import { getDoc } from 'firebase/firestore';

export interface SharedTripSnapshot {
  shareId: string;
  ownerId: string;
  ownerName: string;
  trip: Trip;
  days: Day[];
  activities: Activity[];
  canEdit: boolean;
  createdAt: number;
}

export async function createShareLink(
  uid: string,
  ownerName: string,
  trip: Trip,
  days: Day[],
  activities: Activity[],
  canEdit = false
): Promise<string> {
  const shareId = `${trip.id}-${Date.now().toString(36)}`;
  const sharedRef = doc(db, 'shared', shareId);
  const snapshot: SharedTripSnapshot = {
    shareId,
    ownerId: uid,
    ownerName,
    trip,
    days,
    activities,
    canEdit,
    createdAt: Date.now(),
  };
  await setDoc(sharedRef, snapshot);
  return shareId;
}

export async function getSharedTrip(shareId: string): Promise<SharedTripSnapshot | null> {
  const snap = await getDoc(doc(db, 'shared', shareId));
  return snap.exists() ? (snap.data() as SharedTripSnapshot) : null;
}
