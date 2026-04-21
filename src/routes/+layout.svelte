<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { trip, allTrips, activeTripId, switchTrip, enableFirestoreSync, disableFirestoreSync, days, locations } from '$lib/stores/trip';
  import { user, authReady } from '$lib/stores/auth';
  import { signInWithGoogle, signOutUser } from '$lib/firebase/auth';
  import { aiQuotaRemaining, MAX_GUEST_CALLS } from '$lib/stores/aiQuota';
  import TripEditModal from '$lib/components/TripEditModal.svelte';
  import NewTripModal from '$lib/components/NewTripModal.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import TripTimeline from '$lib/components/TripTimeline.svelte';
  import { currentTheme } from '$lib/stores/theme';

  let { children } = $props();

  let signingIn    = $state(false);
  let tripMenuOpen = $state(false);
  let tripEditOpen = $state(false);
  let newTripOpen  = $state(false);
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

  function isArchived(trip: any): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(trip.endDate + 'T00:00:00');
    return endDate < today;
  }

  const upcomingTrips = $derived($allTrips.filter((t) => !isArchived(t)));
  const archivedTrips = $derived($allTrips.filter((t) => isArchived(t)));

  // ── Reis / Dag switch ───────────────────────────────────────────────────────

  /** Home = new minimal overview page */
  const isOnHome = $derived($page.url.pathname === '/');
  /** Reis = detailed trip overview */
  const isOnReis = $derived($page.url.pathname === '/overview');
  const isOnDag  = $derived($page.url.pathname.startsWith('/day/'));

  // Date of the currently open day (for the TripTimeline marker on day pages)
  const currentDayId   = $derived(isOnDag ? ($page.params.id ?? null) : null);
  const currentDayDate = $derived(
    currentDayId ? ($days.find(d => d.id === currentDayId)?.date ?? null) : null
  );

  // Current city location (for Dag page background color)
  const currentLocationId = $derived(
    isOnDag && currentDayId
      ? ($days.find(d => d.id === currentDayId)?.locationId ?? null)
      : null
  );
  const currentLocation = $derived(
    currentLocationId ? $locations.find(l => l.id === currentLocationId) : null
  );

  // Page background:
  // - Dag: pastel city color (from location.pageColor) if available, else theme bg
  // - Home / Reis: neutral theme background
  const pageBg = $derived(
    isOnDag && currentLocation?.pageColor
      ? currentLocation.pageColor
      : 'var(--clr-bg)'
  );

  /**
   * The day ID to navigate to when clicking "Dag":
   * - If already on a day page → stay on the same day
   * - Otherwise → navigate to today's day, or the first upcoming day
   */
  const dagLinkId = $derived((() => {
    if ($page.url.pathname.startsWith('/day/')) return $page.params.id;
    const today  = new Date().toISOString().slice(0, 10);
    const sorted = [...$days].sort((a, b) => a.date.localeCompare(b.date));
    return (sorted.find(d => d.date >= today) ?? sorted[0])?.id ?? null;
  })());
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

{#if newTripOpen}
  <NewTripModal onClose={() => { newTripOpen = false; }} />
{/if}

{#if settingsOpen}
  <SettingsModal onClose={() => { settingsOpen = false; }} />
{/if}

<div class="min-h-screen" data-theme={$currentTheme.id} style="background-color: {pageBg}; color: var(--clr-text); font-family: var(--font-body, 'Inter', system-ui, sans-serif); overflow-x: hidden; transition: background-color 0.3s ease;">
  <!-- Topbalk -->
  <header class="sticky top-0 z-30" style="background-color: {pageBg}; border-bottom: 1px solid var(--clr-border); transition: background-color 0.3s ease;">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between" style="height: 56px;">

      <!-- Links: Roamly brand + trip selector -->
      <div class="flex items-center gap-3 min-w-0">
        <button onclick={() => goto('/')} class="flex items-center gap-1.5 transition-opacity hover:opacity-80 flex-shrink-0">
          <span class="text-sm font-semibold" style="color: var(--clr-accent); letter-spacing: -0.01em;">Roamly</span>
        </button>

        <!-- Scheidingsteken: desktop only -->
        <span class="hidden sm:inline" style="color: var(--clr-border); font-size: 0.9rem;">/</span>

        <!-- Huidige reis dropdown -->
        <div class="relative">
          <button
            onclick={() => { tripMenuOpen = !tripMenuOpen; }}
            class="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 transition-colors"
            style="color: var(--clr-subtle); background-color: {tripMenuOpen ? 'var(--clr-surface-alt)' : 'transparent'};"
          >
            <!-- Mobile: short generic label to save header space -->
            <span class="font-medium sm:hidden">Reizen</span>
            <!-- Desktop: full trip name -->
            <span class="font-medium hidden sm:inline" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {$trip.name}
            </span>
            <!-- Chevron -->
            <svg class="w-3 h-3 flex-shrink-0 transition-transform" style="color: var(--clr-muted); transform: {tripMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'};" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
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
              class="absolute left-0 mt-1 rounded-2xl z-20 max-h-96 overflow-y-auto"
              style="background: var(--clr-surface); border: 1px solid var(--clr-border); box-shadow: 0 4px 20px rgba(0,0,0,0.12); min-width: 280px; top: 100%;"
            >
              <!-- "Mijn reizen" section header -->
              {#if upcomingTrips.length > 0}
                <div class="px-4 py-2" style="border-bottom: 1px solid var(--clr-border-light);">
                  <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--clr-muted); letter-spacing: 0.05em;">Mijn reizen</p>
                </div>

                <!-- Upcoming trips list -->
                <div class="py-1.5">
                  {#each upcomingTrips as t (t.id)}
                    <button
                      onclick={() => { tripMenuOpen = false; switchTrip(t.id); }}
                      class="w-full flex items-center justify-between gap-2 px-4 py-2 text-xs transition-colors text-left"
                      style="background-color: {$activeTripId === t.id ? 'var(--clr-surface-alt)' : 'transparent'}; color: var(--clr-subtle);"
                      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt)'; }}
                      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = $activeTripId === t.id ? 'var(--clr-surface-alt)' : 'transparent'; }}
                    >
                      <div class="flex-1 min-w-0">
                        <p class="font-medium truncate">{t.name}</p>
                        <p style="color: var(--clr-muted); font-size: 0.7rem;">
                          {formatDate(t.startDate)} – {formatDate(t.endDate)}
                        </p>
                      </div>
                      {#if $activeTripId === t.id}
                        <span style="color: var(--clr-accent); font-weight: bold;">✓</span>
                      {/if}
                    </button>
                  {/each}
                </div>
              {/if}

              <!-- "Archief" section header (only if there are archived trips) -->
              {#if archivedTrips.length > 0}
                <div class="px-4 py-2" style="border-top: 1px solid var(--clr-border-light); border-bottom: 1px solid var(--clr-border-light);">
                  <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--clr-muted); letter-spacing: 0.05em;">Archief</p>
                </div>

                <!-- Archived trips list -->
                <div class="py-1.5">
                  {#each archivedTrips as t (t.id)}
                    <button
                      onclick={() => { tripMenuOpen = false; switchTrip(t.id); }}
                      class="w-full flex items-center justify-between gap-2 px-4 py-2 text-xs transition-colors text-left"
                      style="background-color: {$activeTripId === t.id ? 'var(--clr-surface-alt)' : 'transparent'}; color: var(--clr-subtle);"
                      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt)'; }}
                      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = $activeTripId === t.id ? 'var(--clr-surface-alt)' : 'transparent'; }}
                    >
                      <div class="flex-1 min-w-0">
                        <p class="font-medium truncate">{t.name}</p>
                        <p style="color: var(--clr-muted); font-size: 0.7rem;">
                          {formatDate(t.startDate)} – {formatDate(t.endDate)}
                        </p>
                      </div>
                      {#if $activeTripId === t.id}
                        <span style="color: var(--clr-accent); font-weight: bold;">✓</span>
                      {/if}
                    </button>
                  {/each}
                </div>
              {/if}

              <!-- Acties footer -->
              <div class="py-1.5" style="border-top: 1px solid var(--clr-border-light);">
                <button
                  onclick={() => { tripMenuOpen = false; tripEditOpen = true; }}
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
                  style="color: var(--clr-subtle);"
                  onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt)'; }}
                  onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  <svg class="w-3.5 h-3.5" style="color: var(--clr-muted);" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/>
                  </svg>
                  Reis bewerken
                </button>

                {#if $user}
                  <button
                    onclick={() => { tripMenuOpen = false; newTripOpen = true; }}
                    class="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
                    style="color: var(--clr-subtle);"
                    onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt)'; }}
                    onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <svg class="w-3.5 h-3.5" style="color: var(--clr-muted);" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M7 2v10M2 7h10"/>
                    </svg>
                    Nieuwe reis aanmaken
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Rechts: nav + auth -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Home / Reis / Dag segmented nav -->
        <div
          style="
            display: flex; align-items: center;
            background: var(--clr-surface-alt);
            border-radius: 10px; padding: 2px; gap: 1px;
          "
        >
          <a
            href="/"
            style="
              padding: 4px 10px; border-radius: 8px;
              font-size: 11px; font-weight: {isOnHome ? '600' : '400'};
              text-decoration: none; white-space: nowrap;
              background: {isOnHome ? 'var(--clr-accent-light)' : 'transparent'};
              color: {isOnHome ? 'var(--clr-accent)' : 'var(--clr-muted)'};
              box-shadow: {isOnHome ? '0 1px 3px rgba(0,0,0,0.10)' : 'none'};
              transition: background 0.15s, color 0.15s, box-shadow 0.15s;
            "
          >Home</a>
          <a
            href="/overview"
            style="
              padding: 4px 10px; border-radius: 8px;
              font-size: 11px; font-weight: {isOnReis ? '600' : '400'};
              text-decoration: none; white-space: nowrap;
              background: {isOnReis ? 'var(--clr-accent-light)' : 'transparent'};
              color: {isOnReis ? 'var(--clr-accent)' : 'var(--clr-muted)'};
              box-shadow: {isOnReis ? '0 1px 3px rgba(0,0,0,0.10)' : 'none'};
              transition: background 0.15s, color 0.15s, box-shadow 0.15s;
            "
          >All Cities</a>
          {#if dagLinkId}
            <a
              href="/day/{dagLinkId}"
              style="
                padding: 4px 10px; border-radius: 8px;
                font-size: 11px; font-weight: {isOnDag ? '600' : '400'};
                text-decoration: none; white-space: nowrap;
                background: {isOnDag ? 'var(--clr-accent-light)' : 'transparent'};
                color: {isOnDag ? 'var(--clr-accent)' : 'var(--clr-muted)'};
                box-shadow: {isOnDag ? '0 1px 3px rgba(0,0,0,0.10)' : 'none'};
                transition: background 0.15s, color 0.15s, box-shadow 0.15s;
              "
            >Per Day</a>
          {/if}
        </div>

        <!-- Instellingen: hidden on mobile, shown on sm+ -->
        <button
          onclick={() => { settingsOpen = true; }}
          class="hidden sm:flex w-7 h-7 items-center justify-center rounded-xl transition-colors"
          style="color: var(--clr-muted);"
          title="Instellingen"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt)'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
          <div class="w-7 h-7 rounded-full animate-pulse" style="background-color: var(--clr-surface-alt);"></div>
        {:else if $user}
          <div class="flex items-center gap-1.5">
            <!-- Avatar: always visible -->
            {#if $user.photoURL}
              <img src={$user.photoURL} alt="Profiel" class="w-7 h-7 rounded-full object-cover flex-shrink-0" referrerpolicy="no-referrer" />
            {:else}
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style="background-color: var(--clr-accent-light); color: var(--clr-accent);">
                {($user.displayName ?? 'G')[0]}
              </div>
            {/if}
            <!-- "Uitloggen" text: hidden on mobile -->
            <button
              onclick={handleLogout}
              class="hidden sm:block text-xs px-3 py-1.5 rounded-xl transition-colors"
              style="color: var(--clr-muted);"
            >Uitloggen</button>
            <!-- Settings on mobile: shown next to avatar for logged-in users -->
            <button
              onclick={() => { settingsOpen = true; }}
              class="sm:hidden w-7 h-7 flex items-center justify-center rounded-xl transition-colors"
              style="color: var(--clr-muted);"
              title="Instellingen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        {:else}
          <!-- Not logged in: compact Google login button -->
          <button
            onclick={handleLogin}
            disabled={signingIn}
            class="flex items-center gap-1.5 text-xs rounded-xl font-medium transition-all"
            style="background-color: var(--clr-text); color: var(--clr-bg); opacity: {signingIn ? '0.6' : '1'}; padding: 6px 10px;"
          >
            {#if signingIn}
              <span class="hidden sm:inline">Bezig…</span>
              <svg class="sm:hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="0" style="animation: spin 1s linear infinite;"/>
              </svg>
            {:else}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" class="flex-shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="hidden sm:inline">Inloggen</span>
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Trip timeline strip: always visible; marker shows only on day pages -->
  <div style="border-bottom: 1px solid var(--clr-border); background-color: {pageBg}; transition: background-color 0.3s ease;">
    <div class="max-w-5xl mx-auto px-4 sm:px-6" style="padding-top: 7px; padding-bottom: 7px;">
      <TripTimeline markerDate={isOnDag ? currentDayDate : null} />
    </div>
  </div>

  <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    {@render children()}
  </main>
</div>
