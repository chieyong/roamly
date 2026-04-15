/**
 * Bijhoudt hoeveel AI-calls een niet-ingelogde gebruiker heeft gedaan.
 * Gasten: max 5 calls. Ingelogde gebruikers: onbeperkt.
 */
import { writable, derived, get } from 'svelte/store';
import { user } from './auth';

const QUOTA_KEY  = 'roamly_ai_calls';
export const MAX_GUEST_CALLS = 5;

function loadCount(): number {
  if (typeof localStorage === 'undefined') return 0;
  return parseInt(localStorage.getItem(QUOTA_KEY) ?? '0', 10);
}

export const aiCallCount = writable(0);

// Initialiseer vanuit localStorage (alleen client-side)
if (typeof window !== 'undefined') {
  aiCallCount.set(loadCount());
}

export function incrementAiCall() {
  aiCallCount.update((n) => {
    const next = n + 1;
    if (typeof localStorage !== 'undefined') localStorage.setItem(QUOTA_KEY, String(next));
    return next;
  });
}

export function canUseAi(): boolean {
  if (get(user)) return true;
  return get(aiCallCount) < MAX_GUEST_CALLS;
}

/** Resterende gratis calls (Infinity als ingelogd) */
export const aiQuotaRemaining = derived(
  [aiCallCount, user],
  ([$count, $user]) => ($user ? Infinity : Math.max(0, MAX_GUEST_CALLS - $count))
);
