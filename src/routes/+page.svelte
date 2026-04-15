<script lang="ts">
  import { goto } from '$app/navigation';
  import { trip, daysByLocation, activities } from '$lib/stores/trip';
  import MaybeList from '$lib/components/MaybeList.svelte';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function formatDateShort(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  }

  function formatDayRow(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const tripDays = $derived(() => {
    const start = new Date($trip.startDate + 'T00:00:00');
    const end   = new Date($trip.endDate   + 'T00:00:00');
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  });

  // First non-maybe activity per day (for the preview label)
  function topActivity(dayId: string): string | null {
    const act = $activities
      .filter((a) => a.dayId === dayId && a.section !== 'maybe')
      .sort((a, b) => a.order - b.order)[0];
    return act?.title ?? null;
  }

  // Map Tailwind color class → accent hex
  const colorMap: Record<string, string> = {
    'bg-teal-100':   '#14b8a6',
    'bg-blue-100':   '#3b82f6',
    'bg-amber-100':  '#f59e0b',
    'bg-rose-100':   '#f43f5e',
    'bg-purple-100': '#a855f7',
    'bg-green-100':  '#22c55e',
  };

  function cityColor(key: string): string {
    return colorMap[key] ?? '#a09e98';
  }

  // Soft pastel bg for city header badge
  const badgeMap: Record<string, string> = {
    'bg-teal-100':   '#f0fdfa',
    'bg-blue-100':   '#eff6ff',
    'bg-amber-100':  '#fffbeb',
    'bg-rose-100':   '#fff1f2',
    'bg-purple-100': '#faf5ff',
    'bg-green-100':  '#f0fdf4',
  };

  function cityBadge(key: string): string {
    return badgeMap[key] ?? '#f4f3ef';
  }
</script>

<!-- ── Header ─────────────────────────────────────────────────────────────── -->
<div class="mb-10">
  <p class="text-xs font-medium mb-1" style="color: #c4c1bb; letter-spacing: 0.04em;">roamly</p>
  <h1 class="text-2xl font-semibold" style="color: #1a1917; letter-spacing: -0.02em;">
    {$trip.coverEmoji ?? '✈️'} {$trip.name}
  </h1>
  <p class="text-sm mt-1" style="color: #a09e98;">
    {formatDateShort($trip.startDate)} – {formatDateShort($trip.endDate)}
    <span class="mx-1.5" style="color: #d4d1c8;">·</span>
    {tripDays()} dagen
  </p>
</div>

<!-- ── Main grid ──────────────────────────────────────────────────────────── -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-10">

  <!-- Timeline -->
  <div class="lg:col-span-2 space-y-8">
    {#each $daysByLocation as { location, days }}
      {#if days.length > 0}
        <div>
          <!-- City header -->
          <div class="flex items-center gap-2 mb-2">
            <div
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style="background-color: {cityColor(location.color)};"
            ></div>
            <span class="text-xs font-semibold" style="color: #1a1917;">
              {location.emoji} {location.name}
            </span>
            <span class="text-xs" style="color: #b0ada7;">
              {formatDateShort(location.startDate)} – {formatDateShort(location.endDate)}
              · {days.length} {days.length === 1 ? 'dag' : 'dagen'}
            </span>
          </div>

          <!-- Day rows -->
          <div class="flex flex-col" style="border-left: 3px solid {cityColor(location.color)}; margin-left: 4px;">
            {#each days as day, i}
              {@const preview = topActivity(day.id)}
              <button
                onclick={() => goto(`/day/${day.id}`)}
                class="group flex items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors rounded-r-xl"
                style="background-color: transparent;"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = cityBadge(location.color); }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <div class="flex items-baseline gap-3 min-w-0">
                  <!-- Date -->
                  <span
                    class="text-xs flex-shrink-0 tabular-nums"
                    style="color: #8b8a84; min-width: 80px;"
                  >
                    {formatDayRow(day.date)}
                  </span>

                  <!-- Top activity preview -->
                  {#if preview}
                    <span class="text-xs truncate" style="color: #57564f;">{preview}</span>
                  {:else}
                    <span class="text-xs italic" style="color: #c4c1bb;">Nog niets gepland</span>
                  {/if}
                </div>

                <!-- Arrow -->
                <svg
                  class="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style="color: {cityColor(location.color)};"
                  viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"
                >
                  <path d="M5 2.5l4.5 4.5L5 11.5"/>
                </svg>
              </button>

              <!-- Subtle divider between days (not after last) -->
              {#if i < days.length - 1}
                <div style="height: 1px; margin-left: 16px; background-color: #f0eeea;"></div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Sidebar: Maybe list -->
  <div class="lg:col-span-1">
    <div class="sticky" style="top: 80px;">
      <MaybeList />
    </div>
  </div>
</div>
