<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { trip, enableFirestoreSync, disableFirestoreSync } from '$lib/stores/trip';
  import { user, authReady } from '$lib/stores/auth';
  import { signInWithGoogle, signOutUser } from '$lib/firebase/auth';
  import { aiQuotaRemaining, MAX_GUEST_CALLS } from '$lib/stores/aiQuota';

  let { children } = $props();

  let signingIn = $state(false);

  // Start/stop Firestore sync when auth state changes
  $effect(() => {
    if ($user) {
      enableFirestoreSync($user.uid);
    } else {
      disableFirestoreSync();
    }
  });

  async function handleLogin() {
    signingIn = true;
    try { await signInWithGoogle(); }
    catch { /* popup gesloten */ }
    finally { signingIn = false; }
  }

  async function handleLogout() {
    await signOutUser();
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  }
</script>

<svelte:head>
  <title>Roamly – {$trip.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen" style="background-color: #fafaf8; font-family: 'Inter', system-ui, sans-serif;">
  <!-- Topbalk -->
  <header class="sticky top-0 z-30" style="background-color: rgba(250,250,248,0.92); backdrop-filter: blur(8px); border-bottom: 1px solid #e8e6e0;">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between" style="height: 56px;">

      <!-- Links: trip naam -->
      <button onclick={() => goto('/')} class="flex items-center gap-2 transition-opacity hover:opacity-70">
        <span style="font-size: 1.2rem;">{$trip.coverEmoji ?? '✈️'}</span>
        <span style="font-weight: 600; font-size: 0.875rem; color: #2a2926;">{$trip.name}</span>
      </button>

      <!-- Rechts: datum + nav + auth -->
      <div class="flex items-center gap-3">
        <!-- Datumbereik (verborgen op mobiel) -->
        <span class="hidden sm:block text-xs" style="color: #a09e98;">
          {formatDate($trip.startDate)} – {formatDate($trip.endDate)}
        </span>

        <!-- Overzicht link -->
        <a
          href="/"
          class="text-xs px-3 py-1.5 rounded-xl transition-all"
          style="{$page.url.pathname === '/'
            ? 'background-color: #ccfbf1; color: #0f766e; font-weight: 500;'
            : 'color: #8b8a84;'}"
        >Overzicht</a>

        <!-- AI quota voor gasten -->
        {#if $authReady && !$user && $aiQuotaRemaining < MAX_GUEST_CALLS}
          <span class="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl"
            style="background-color: #fef9f0; color: #b45309; border: 1px solid #fde68a;">
            ✦ {$aiQuotaRemaining} / {MAX_GUEST_CALLS}
          </span>
        {/if}

        <!-- Auth knop -->
        {#if !$authReady}
          <!-- Laden -->
          <div class="w-7 h-7 rounded-full animate-pulse" style="background-color: #e8e6e0;"></div>
        {:else if $user}
          <!-- Ingelogd: avatar + uitloggen -->
          <div class="flex items-center gap-2">
            {#if $user.photoURL}
              <img src={$user.photoURL} alt="Profiel" class="w-7 h-7 rounded-full object-cover" referrerpolicy="no-referrer" />
            {:else}
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style="background-color: #ccfbf1; color: #0d9488;">
                {($user.displayName ?? 'G')[0]}
              </div>
            {/if}
            <button
              onclick={handleLogout}
              class="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style="color: #8b8a84;"
            >Uitloggen</button>
          </div>
        {:else}
          <!-- Niet ingelogd: inlogknop -->
          <button
            onclick={handleLogin}
            disabled={signingIn}
            class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
            style="background-color: #1a1917; color: white; opacity: {signingIn ? '0.6' : '1'};"
          >
            {#if signingIn}
              Bezig…
            {:else}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Inloggen
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    {@render children()}
  </main>
</div>
