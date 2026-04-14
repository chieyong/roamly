<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { days, locations, activities, updateActivity } from '$lib/stores/trip';
  import { focusMode, focusSection, mapFocusLocation } from '$lib/stores/ui';
  import { optimizeDay } from '$lib/ai/suggestions';
  import DaySection from '$lib/components/DaySection.svelte';
  import MaybeList from '$lib/components/MaybeList.svelte';
  import MiniMap from '$lib/components/MiniMap.svelte';
  import { getCoord, TOKYO_CENTER } from '$lib/utils/coordinates';
  import type { Activity, Section } from '$lib/types';
  import type { LatLng } from '$lib/utils/coordinates';

  // Only ONE MiniMap is mounted at a time (mobile OR desktop) so the hidden
  // one never gets a 0×0 container that causes Leaflet NaN projection errors.
  let isDesktop = $state(false);
  let mq: MediaQueryList | undefined;

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
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  function formatShort(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatDayPill(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
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
        <h1 class="text-2xl font-semibold" style="color: #1a1917; letter-spacing: -0.02em; line-height: 1.2;">
          {formatDate(day.date)}
        </h1>

        <button
          onclick={() => focusMode.update((v) => !v)}
          class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all mt-0.5"
          style="{$focusMode
            ? 'background-color: #f0fdfa; color: #0d9488; border: 1px solid #a7f3d0;'
            : 'background-color: transparent; color: #b0ada7; border: 1px solid #e8e6e0;'}"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="6" cy="6" r="4"/>
            <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
          {$focusMode ? 'focused' : 'focus'}
        </button>
      </div>

      <div class="flex gap-1.5 mt-4 overflow-x-auto pb-1" style="scrollbar-width: none; -webkit-overflow-scrolling: touch;">
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
