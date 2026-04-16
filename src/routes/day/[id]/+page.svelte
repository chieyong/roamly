<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { days, locations, activities, updateActivity, updateDay } from '$lib/stores/trip';
  import { focusMode, focusSection, mapFocusLocation } from '$lib/stores/ui';
  import { optimizeDay } from '$lib/ai/suggestions';
  import DaySection from '$lib/components/DaySection.svelte';
  import MaybeList from '$lib/components/MaybeList.svelte';
  import MiniMap from '$lib/components/MiniMap.svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import { getCoord, TOKYO_CENTER } from '$lib/utils/coordinates';
  import type { Activity, Section } from '$lib/types';
  import type { LatLng } from '$lib/utils/coordinates';

  // Only ONE MiniMap is mounted at a time (mobile OR desktop) so the hidden
  // one never gets a 0×0 container that causes Leaflet NaN projection errors.
  let isDesktop  = $state(false);
  let mq: MediaQueryList | undefined;
  let shareOpen  = $state(false);

  onMount(() => {
    mq = window.matchMedia('(min-width: 1024px)');
    isDesktop = mq.matches;
    const handler = (e: MediaQueryListEvent) => { isDesktop = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq?.removeEventListener('change', handler);
  });

  const dayId        = $derived($page.params.id);
  const day          = $derived($days.find((d) => d.id === dayId));
  const location     = $derived(day ? $locations.find((l) => l.id === day!.locationId) : null);
  const locationDays = $derived(day ? $days.filter((d) => d.locationId === day!.locationId) : []);
  const allSorted    = $derived([...$days].sort((a, b) => a.date.localeCompare(b.date)));
  const globalIndex  = $derived(allSorted.findIndex((d) => d.id === dayId));
  const prevDay      = $derived(globalIndex > 0 ? allSorted[globalIndex - 1] : null);
  const nextDay      = $derived(globalIndex < allSorted.length - 1 ? allSorted[globalIndex + 1] : null);
  const dayIndex     = $derived(locationDays.findIndex((d) => d.id === dayId));

  // Reisdag
  const departureLocation = $derived(
    day?.departureLocationId ? $locations.find(l => l.id === day!.departureLocationId) ?? null : null
  );
  const otherLocations = $derived(
    $locations.filter(l => l.id !== location?.id)
  );
  let travelMenuOpen = $state(false);

  function setDeparture(locId: string | null) {
    if (!day) return;
    updateDay(day.id, { departureLocationId: locId ?? undefined });
    travelMenuOpen = false;
  }

  const mornActivities = $derived(
    $activities.filter((a) => a.dayId === dayId && a.section === 'morning').sort((a, b) => a.order - b.order)
  );
  const aftnActivities = $derived(
    $activities.filter((a) => a.dayId === dayId && a.section === 'afternoon').sort((a, b) => a.order - b.order)
  );
  const evngActivities = $derived(
    $activities.filter((a) => a.dayId === dayId && a.section === 'evening').sort((a, b) => a.order - b.order)
  );

  // ── Map state (driven by clicking activity cards) ──────────────────────────
  // When the day changes, seed the map with the first activity that has a location.
  $effect(() => {
    dayId; // track day changes
    const first = [...mornActivities, ...aftnActivities, ...evngActivities]
      .find((a) => a.location && getCoord(a.location));
    mapFocusLocation.set(first?.location ?? location?.name ?? null);
  });

  const activeCoord = $derived<LatLng | null>(getCoord($mapFocusLocation));
  const activeLabel = $derived($mapFocusLocation ?? '');

  // ── Optimize day ─────────────────────────────────────────────────────────
  type OptimizeState = 'idle' | 'loading' | 'preview';
  let optimizeState = $state<OptimizeState>('idle');
  let optimized     = $state<Activity[]>([]);
  let originals     = $state<Map<string, Activity>>(new Map());

  async function runOptimize() {
    optimizeState = 'loading';
    const dayActivities = get(activities).filter(
      (a) => a.dayId === dayId && a.section !== 'maybe'
    );
    originals = new Map(dayActivities.map((a) => [a.id, { ...a }]));
    const loc = location?.name ?? 'japan';
    optimized = await optimizeDay(dayActivities, loc);
    optimizeState = 'preview';
  }

  function applyOptimize() {
    optimized.forEach((a) => updateActivity(a));
    optimizeState = 'idle';
  }

  const changeCount = $derived(
    optimized.filter((a) => {
      const o = originals.get(a.id);
      return o && (o.section !== a.section || o.time !== a.time);
    }).length
  );

  $effect(() => {
    dayId;
    optimizeState = 'idle';
    optimized = [];
    originals = new Map();
  });

  // ─────────────────────────────────────────────────────────────────────────
  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  function formatShort(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
  }

  function formatDayPill(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' });
  }

  const sectionOrder: Section[] = ['morning', 'afternoon', 'evening'];
  function cycleFocusSection(dir: 1 | -1) {
    const idx  = sectionOrder.indexOf($focusSection);
    const next = (idx + dir + sectionOrder.length) % sectionOrder.length;
    focusSection.set(sectionOrder[next]);
  }
</script>

{#if !day}
  <div class="flex flex-col items-center justify-center py-32 text-center">
    <p class="text-3xl mb-3">🗺️</p>
    <p class="text-base font-medium" style="color: #2a2926;">Day not found</p>
    <button onclick={() => goto('/')} class="mt-3 text-sm hover:underline" style="color: #14b8a6;">← Back</button>
  </div>

{:else}

  <!--
    On mobile the map is fixed at the bottom of the screen, so we add
    bottom padding to the page content so cards don't hide behind it.
  -->
  <div class="lg:pb-0" style="padding-bottom: 168px;">

    <!-- ── Header (scrolls with page) ──────────────────────────────────── -->
    <div class="mb-5">
      <div class="flex items-center gap-1.5 mb-4 text-xs" style="color: #b0ada7;">
        <button onclick={() => goto('/')} class="hover:underline transition-colors" style="color: #b0ada7;">
          ← {location?.name}
        </button>
        <span>·</span>
        <span>Day {dayIndex + 1} of {locationDays.length}</span>
      </div>

      <div class="flex items-start justify-between gap-3">
        <h1 class="text-2xl font-semibold" style="color: var(--clr-text, #1a1917); letter-spacing: -0.02em; line-height: 1.2; font-family: var(--font-header);">
          {formatDate(day.date)}
        </h1>

        <div class="flex items-center gap-2 mt-0.5">
          <!-- Reisdag toggle -->
          <div class="relative">
            <button
              onclick={() => { travelMenuOpen = !travelMenuOpen; }}
              class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style="{departureLocation
                ? 'background-color: #fefce8; color: #92400e; border: 1px solid #fde68a;'
                : 'background-color: transparent; color: #b0ada7; border: 1px solid #e8e6e0;'}"
            >
              🚄 {departureLocation ? `van ${departureLocation.name}` : 'reisdag'}
            </button>

            {#if travelMenuOpen}
              <button
                class="fixed inset-0 z-10"
                onclick={() => { travelMenuOpen = false; }}
                style="background: transparent; border: none; cursor: default;"
                aria-label="Sluit menu"
              ></button>
              <div
                class="absolute right-0 mt-1 rounded-2xl z-20"
                style="background: white; border: 1px solid #e8e6e0; box-shadow: 0 4px 20px rgba(0,0,0,0.10); min-width: 180px; top: 100%;"
              >
                <div class="px-3 py-2" style="border-bottom: 1px solid #f0eeea;">
                  <p class="text-xs" style="color: #8b8a84;">Vertrek vanuit…</p>
                </div>
                <div class="py-1.5">
                  {#each otherLocations as loc}
                    <button
                      onclick={() => setDeparture(loc.id)}
                      class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                      style="color: {day?.departureLocationId === loc.id ? '#0d9488' : '#57564f'}; background-color: {day?.departureLocationId === loc.id ? '#f0fdfa' : 'transparent'};"
                      onmouseenter={(e) => { if (day?.departureLocationId !== loc.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
                      onmouseleave={(e) => { if (day?.departureLocationId !== loc.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span>{loc.emoji}</span>
                      <span>{loc.name}</span>
                      {#if day?.departureLocationId === loc.id}<span class="ml-auto">✓</span>{/if}
                    </button>
                  {/each}
                  {#if departureLocation}
                    <div style="height: 1px; background: #f0eeea; margin: 4px 12px;"></div>
                    <button
                      onclick={() => setDeparture(null)}
                      class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left"
                      style="color: #b0ada7;"
                      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
                      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      Geen reisdag
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Delen -->
          <button
            onclick={() => { shareOpen = true; }}
            class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style="background-color: transparent; color: #b0ada7; border: 1px solid #e8e6e0;"
          >
            <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="2" r="1.2"/>
              <circle cx="2" cy="6" r="1.2"/>
              <circle cx="9" cy="10" r="1.2"/>
              <line x1="3.1" y1="5.4" x2="7.9" y2="2.6"/>
              <line x1="3.1" y1="6.6" x2="7.9" y2="9.4"/>
            </svg>
            Delen
          </button>

          <!-- Focus -->
          <button
            onclick={() => focusMode.update((v) => !v)}
            class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style="{$focusMode
              ? 'background-color: #f0fdfa; color: #0d9488; border: 1px solid #a7f3d0;'
              : 'background-color: transparent; color: #b0ada7; border: 1px solid #e8e6e0;'}"
          >
            <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="6" cy="6" r="4"/>
              <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
            {$focusMode ? 'gefocust' : 'focus'}
          </button>
        </div>
      </div>

      <div class="flex gap-1.5 mt-4 overflow-x-auto pb-1" style="scrollbar-width: none; -webkit-overflow-scrolling: touch;">
        <!-- Vorige locatie pill — alleen op de EERSTE dag van een nieuwe locatie -->
        {#if prevDay && dayIndex === 0}
          {@const prevLoc = $locations.find((l) => l.id === $days.find(d => d.id === prevDay.id)?.locationId)}
          {#if prevLoc && prevLoc.id !== location?.id}
            <a
              href="/day/{prevDay.id}"
              class="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs transition-all"
              style="color: #c4bfb9; border: 1px dashed #e8e6e0;"
            >
              ← {prevLoc.emoji} {prevLoc.name}
            </a>
            <span class="flex-shrink-0 flex items-center px-1 text-xs" style="color: #d4d1c8;">·</span>
          {/if}
        {/if}

        <!-- Dagen van huidige locatie -->
        {#each locationDays as d}
          <a
            href="/day/{d.id}"
            class="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style="{d.id === dayId
              ? 'background-color: #1a1917; color: white;'
              : 'background-color: transparent; color: #b0ada7; border: 1px solid #e8e6e0;'}"
          >
            {formatDayPill(d.date)}
          </a>
        {/each}

        <!-- Volgende locatie pill — alleen op de LAATSTE dag van huidige locatie -->
        {#if nextDay}
          {@const nextLoc = $locations.find((l) => l.id === allSorted.find(d => d.id === nextDay.id)?.locationId)}
          {#if nextLoc && nextLoc.id !== location?.id}
            <span class="flex-shrink-0 flex items-center px-1 text-xs" style="color: #d4d1c8;">·</span>
            <a
              href="/day/{nextDay.id}"
              class="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs transition-all"
              style="color: #c4bfb9; border: 1px dashed #e8e6e0;"
            >
              {nextLoc.emoji} {nextLoc.name} →
            </a>
          {/if}
        {/if}
      </div>
    </div>

    <!-- ── Main content ─────────────────────────────────────────────────── -->
    {#if $focusMode}
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6 px-1">
          <button
            onclick={() => cycleFocusSection(-1)}
            aria-label="Previous section"
            class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style="color: #b0ada7;"
          >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>
          <p class="text-sm font-medium" style="color: #2a2926;">
            {$focusSection === 'morning' ? '🌅' : $focusSection === 'afternoon' ? '☀️' : '🌙'}
            {$focusSection}
          </p>
          <button
            onclick={() => cycleFocusSection(1)}
            aria-label="Next section"
            class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style="color: #b0ada7;"
          >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 3l5 5-5 5"/>
            </svg>
          </button>
        </div>

        {#if $focusSection === 'morning'}
          <DaySection {dayId} section="morning" sectionActivities={mornActivities} />
        {:else if $focusSection === 'afternoon'}
          <DaySection {dayId} section="afternoon" sectionActivities={aftnActivities} />
        {:else}
          <DaySection {dayId} section="evening" sectionActivities={evngActivities} />
        {/if}

        <p class="text-center text-xs mt-8" style="color: #c4bfb9;">
          <button onclick={() => focusMode.set(false)} class="hover:underline" style="color: #14b8a6;">
            show full day
          </button>
        </p>
      </div>

    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Sections -->
        <div class="lg:col-span-2 space-y-8">
          <DaySection {dayId} section="morning"   sectionActivities={mornActivities} />

          <!-- ── Reisbanner (tussen ochtend en middag) ────────────────────── -->
          {#if departureLocation}
            <div
              class="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style="background: linear-gradient(to right, #fffbeb, #f0fdfa); border: 1px solid #fde68a;"
            >
              <span style="font-size: 1.25rem; flex-shrink: 0;">🚄</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold" style="color: #92400e;">
                  {departureLocation.name}
                  <span style="color: #a09e98; font-weight: 400;"> → </span>
                  {location?.name}
                </p>
                <p class="text-xs mt-0.5" style="color: #b45309;">Reisdag — plan activiteiten voor en na aankomst</p>
              </div>
            </div>
          {/if}

          <DaySection {dayId} section="afternoon" sectionActivities={aftnActivities} />
          <DaySection {dayId} section="evening"   sectionActivities={evngActivities} />

          <!-- ── Optimize ─────────────────────────────────────────────── -->
          <div class="pt-2">
            {#if optimizeState === 'idle'}
              <button
                onclick={runOptimize}
                class="flex items-center gap-1.5 text-xs transition-colors"
                style="color: #b0ada7;"
              >
                <span style="color: #14b8a6; font-size: 10px;">✦</span>
                Optimize this day
              </button>

            {:else if optimizeState === 'loading'}
              <div class="flex items-center gap-2 text-xs" style="color: #b0ada7;">
                <div class="w-3.5 h-3.5 rounded-full animate-spin flex-shrink-0"
                  style="border: 1.5px solid #e8e6e0; border-top-color: #14b8a6;"></div>
                Optimizing…
              </div>

            {:else if optimizeState === 'preview'}
              <div class="rounded-2xl p-4 space-y-4" style="background-color: white; border: 1px solid #e8e6e0;">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs" style="color: #14b8a6;">✦</span>
                    <span class="text-xs font-medium" style="color: #57564f;">Suggested order</span>
                    {#if changeCount > 0}
                      <span class="text-xs px-1.5 py-0.5 rounded-full" style="background-color: #f0fdfa; color: #0d9488;">
                        {changeCount} change{changeCount === 1 ? '' : 's'}
                      </span>
                    {/if}
                  </div>
                  <button onclick={() => { optimizeState = 'idle'; }} class="text-xs hover:underline" style="color: #b0ada7;">Dismiss</button>
                </div>

                <div class="space-y-0">
                  {#each optimized as a}
                    {@const orig = originals.get(a.id)}
                    {@const sectionChanged = orig && orig.section !== a.section}
                    {@const timeChanged    = orig && orig.time !== a.time}
                    {@const anyChange      = sectionChanged || timeChanged}
                    <div class="flex items-center gap-3 py-2" style="border-bottom: 1px solid #f4f3ef;">
                      <div class="w-16 flex-shrink-0">
                        {#if sectionChanged}
                          <span class="text-xs line-through" style="color: #d4d1c8;">{orig!.section}</span>
                          <span class="text-xs ml-0.5" style="color: #c4bfb9;">→</span>
                          <span class="text-xs ml-0.5 capitalize" style="color: #57564f;">{a.section}</span>
                        {:else}
                          <span class="text-xs capitalize" style="color: {anyChange ? '#b0ada7' : '#c4bfb9'};">{a.section}</span>
                        {/if}
                      </div>
                      <span class="text-xs flex-1 min-w-0 truncate" style="color: {anyChange ? '#1a1917' : '#8b8a84'};">{a.title}</span>
                      <div class="flex items-center gap-1 flex-shrink-0 tabular-nums">
                        {#if timeChanged && orig!.time}
                          <span class="text-xs line-through" style="color: #d4d1c8;">{orig!.time}</span>
                          <span class="text-xs" style="color: #d4d1c8;">→</span>
                        {/if}
                        {#if a.time}
                          <span class="text-xs font-medium" style="color: {timeChanged ? '#0d9488' : '#b0ada7'};">{a.time}</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>

                <div class="flex gap-2 pt-1">
                  <button onclick={applyOptimize} class="text-xs px-4 py-2 rounded-xl font-medium" style="background-color: #1a1917; color: white;">Apply</button>
                  <button onclick={() => { optimizeState = 'idle'; }} class="text-xs px-3 py-2 rounded-xl" style="color: #b0ada7; background-color: #f4f3ef;">Cancel</button>
                </div>
              </div>
            {/if}
          </div>

          <!-- Prev / Next — mobile only -->
          <div class="flex items-center justify-between pt-4 lg:hidden" style="border-top: 1px solid #f0ede8;">
            {#if prevDay}
              <button onclick={() => goto(`/day/${prevDay!.id}`)} class="text-xs flex items-center gap-1" style="color: #b0ada7;">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3L5 8l5 5"/></svg>
                {formatShort(prevDay.date)}
              </button>
            {:else}
              <span></span>
            {/if}
            {#if nextDay}
              <button onclick={() => goto(`/day/${nextDay!.id}`)} class="text-xs flex items-center gap-1" style="color: #b0ada7;">
                {formatShort(nextDay.date)}
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3l5 5-5 5"/></svg>
              </button>
            {:else}
              <span></span>
            {/if}
          </div>
        </div>

        <!-- Desktop sidebar: map + maybe list (only mounted on desktop) -->
        <div class="hidden lg:block lg:col-span-1">
          <div class="sticky space-y-4" style="top: 72px;">
            {#if isDesktop}
              <div style="height: 200px; border-radius: 18px; overflow: hidden; border: 1px solid #e8e6e0; box-shadow: 0 2px 12px rgba(0,0,0,0.06); background-color: #f4f3ef;">
                <MiniMap coord={activeCoord} label={activeLabel} zoom={14} />
              </div>
            {/if}
            <MaybeList />
          </div>
        </div>

      </div>
    {/if}

  </div><!-- end content padding wrapper -->

  <!-- ── Mobile map: fixed at bottom (only mounted on mobile) ───────────── -->
  {#if !$focusMode && !isDesktop}
    <div style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; padding: 0 12px 14px;">
      <div
        style="
          height: 140px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(232,230,224,0.8);
          box-shadow: 0 -4px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
          background-color: #f4f3ef;
        "
      >
        <MiniMap coord={activeCoord} label={activeLabel} zoom={14} />
      </div>
    </div>
  {/if}

{/if}

{#if shareOpen}
  <ShareModal onClose={() => { shareOpen = false; }} />
{/if}
