/**
 * Reactive auth store — wraps Firebase onAuthStateChanged so every
 * component can read the current user with $user.
 *
 * Usage:
 *   import { user, authReady } from '$lib/stores/auth';
 *   $user        → FirebaseUser | null
 *   $authReady   → true once Firebase has resolved the initial auth state
 */
import { writable, derived } from 'svelte/store';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/firebase/auth';

const _user    = writable<User | null>(null);
const _ready   = writable(false);

// Subscribe to Firebase auth state once (module-level singleton)
onAuthStateChanged(auth, (firebaseUser) => {
  _user.set(firebaseUser);
  _ready.set(true);
});

export const user      = { subscribe: _user.subscribe };
export const authReady = { subscribe: _ready.subscribe };

/** Convenience: uid of the logged-in user, or null */
export const uid = derived(_user, ($u) => $u?.uid ?? null);
