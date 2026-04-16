<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { trip, enableFirestoreSync, disableFirestoreSync } from '$lib/stores/trip';
  import { user, authReady } from '$lib/stores/auth';
  import { signInWithGoogle, signOutUser } from '$lib/firebase/auth';
  import { aiQuotaRemaining, MAX_GUEST_CALLS } from '$lib/stores/aiQuota';
  import TripEditModal from '$lib/components/TripEditModal.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import { currentTheme } from '$lib/stores/theme';

  let { children } = $props();

  let signingIn    = $state(false);
  let tripMenuOpen = $state(false);
  let tripEditOpen = $state(false);
  let settingsOpen = $state(false);

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
  <title>Roamly</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{#if tripEditOpen}
  <TripEditModal onClose={() => { tripEditOpen = false; }} />
{/if}

{#if settingsOpen}
  <SettingsModal onClose={() => { settingsOpen = false; }} />
{/if}

<div class="min-h-screen" data-theme={$currentTheme.id} style="background-color: var(--clr-bg, #fafaf8); color: var(--clr-text, #1a1917); font-family: var(--font-body, 'Inter', system-ui, sans-serif);">
  <!-- Topbalk -->
  <header class="sticky top-0 z-30" style="background-color: var(--clr-header-bg, rgba(250,250,248,0.92)); backdrop-filter: blur(8px); border-bottom: 1px solid var(--clr-border, #e8e6e0);">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between" style="height: 56px;">

      <!-- Links: Roamly brand -->
      <div class="flex items-center gap-3">
        <button onclick={() => goto('/')} class="flex items-center gap-1.5 transition-opacity hover:opacity-80">
          <span class="text-sm font-semibold" style="color: #0d9488; letter-spacing: -0.01em;">Roamly</span>
        </button>

        <!-- Scheidingsteken -->
        <span style="color: #d4d1c8; font-size: 0.9rem;">/</span>

        <!-- Huidige reis dropdown -->
        <div class="relative">
          <button
            onclick={() => { tripMenuOpen = !tripMenuOpen; }}
            class="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 transition-colors"
            style="color: #57564f; background-color: {tripMenuOpen ? '#f0eeea' : 'transparent'};"
          >
            <span>{$trip.coverEmoji ?? '✈️'}</span>
            <span class="font-medium hidden sm:inline" style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {$trip.name}
            </span>
            <!-- Chevron -->
            <svg class="w-3 h-3 flex-shrink-0 transition-transform" style="color: #a09e98; transform: {tripMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'};" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </button>

          {#if tripMenuOpen}
            <!-- Backdrop -->
            <button
              class="fixed inset-0 z-10"
              onclick={() => { tripMenuOpen = false; }}
              style="background: transparent; border: none; cursor: default;"
              aria-label="Sluit menu"
            ></button>

            <!-- Dropdown menu -->
            <div
              class="absolute left-0 mt-1 rounded-2xl z-20"
              style="background: white; border: 1px solid #e8e6e0; box-shadow: 0 4px 20px rgba(0,0,0,0.10); min-width: 200px; top: 100%;"
            >
              <!-- Huidige reis info -->
              <div class="px-4 py-3" style="border-bottom: 1px solid #f0eeea;">
                <p class="text-xs font-semibold" style="color: #1a1917;">{$trip.coverEmoji ?? '✈️'} {$trip.name}</p>
                <p class="text-xs mt-0.5" style="color: #a09e98;">
                  {formatDate($trip.startDate)} – {formatDate($trip.endDate)}
                </p>
              </div>

              <!-- Acties -->
              <div class="py-1.5">
                <button
                  onclick={() => { tripMenuOpen = false; tripEditOpen = true; }}
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
                  style="color: #57564f;"
                  onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
                  onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  <!-- Potlood icoon -->
                  <svg class="w-3.5 h-3.5" style="color: #8b8a84;" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/>
                  </svg>
                  Reis bewerken
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Rechts: nav + auth -->
      <div class="flex items-center gap-3">
        <!-- Overzicht link -->
        <a
          href="/"
          class="text-xs px-3 py-1.5 rounded-xl transition-all"
          style="{$page.url.pathname === '/'
            ? 'background-color: #ccfbf1; color: #0f766e; font-weight: 500;'
            : 'color: #8b8a84;'}"
        >Overzicht</a>

        <!-- Instellingen -->
        <button
          onclick={() => { settingsOpen = true; }}
          class="w-7 h-7 flex items-center justify-center rounded-xl transition-colors"
          style="color: #8b8a84;"
          title="Instellingen"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt, #f4f3ef)'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4">
            <circle cx="7.5" cy="7.5" r="2.2"/>
            <path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M12.2 2.8l-1.1 1.1M3.9 11.1l-1.1 1.1M12.2 12.2l-1.1-1.1M3.9 3.9L2.8 2.8"/>
          </svg>
        </button>

        <!-- AI quota voor gasten -->
        {#if $authReady && !$user && $aiQuotaRemaining < MAX_GUEST_CALLS}
          <span class="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl"
            style="background-color: #fef9f0; color: #b45309; border: 1px solid #fde68a;">
            ✦ {$aiQuotaRemaining} / {MAX_GUEST_CALLS}
          </span>
        {/if}

        <!-- Auth knop -->
        {#if !$authReady}
          <div class="w-7 h-7 rounded-full animate-pulse" style="background-color: #e8e6e0;"></div>
        {:else if $user}
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
