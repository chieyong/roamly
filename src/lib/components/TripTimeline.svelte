<script lang="ts">
  import { goto } from '$app/navigation';
  import { trip, locations } from '$lib/stores/trip';

  // Map Tailwind color class → hex
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

  function daysBetween(start: string, end: string): number {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end   + 'T00:00:00');
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
  }

  type Segment =
    | { type: 'city'; name: string; color: string; days: number }
    | { type: 'gap'; days: number };

  const totalDays = $derived(daysBetween($trip.startDate, $trip.endDate));

  const segments = $derived((() => {
    if (totalDays === 0) return [] as Segment[];

    const sorted = [...$locations].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const result: Segment[] = [];
    let cursor = $trip.startDate;

    for (const loc of sorted) {
      // Gap before this city
      if (loc.startDate > cursor) {
        const g = daysBetween(cursor, loc.startDate);
        if (g > 0) result.push({ type: 'gap', days: g });
      }
      const d = daysBetween(loc.startDate, loc.endDate);
      if (d > 0) result.push({ type: 'city', name: loc.name, color: cityColor(loc.color), days: d });
      if (loc.endDate > cursor) cursor = loc.endDate;
    }

    // Trailing gap
    if (cursor < $trip.endDate) {
      const g = daysBetween(cursor, $trip.endDate);
      if (g > 0) result.push({ type: 'gap', days: g });
    }

    return result;
  })());

  // "Today" position as a percentage across the timeline
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPct = $derived(
    todayStr >= $trip.startDate && todayStr < $trip.endDate
      ? (daysBetween($trip.startDate, todayStr) / totalDays) * 100
      : null
  );

  function pct(seg: Segment): string {
    return ((seg.days / totalDays) * 100).toFixed(3);
  }
</script>

<!--
  Compact horizontal trip timeline.
  Clicking navigates to the main overview (/). Visible only on day pages (via layout).
-->
<div
  role="button"
  tabindex="0"
  title="Bekijk volledig reisoverzicht"
  onclick={() => goto('/')}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto('/'); }}
  style="cursor: pointer; user-select: none; position: relative; padding: 3px 0;"
>
  <!-- Colored bar -->
  <div style="display: flex; height: 7px; border-radius: 4px; overflow: hidden; width: 100%;">
    {#each segments as seg, i}
      {#if seg.type === 'city'}
        <div
          style="
            width: {pct(seg)}%;
            background-color: {seg.color};
            flex-shrink: 0;
            border-radius: {i === 0 ? '4px 0 0 4px' : i === segments.length - 1 ? '0 4px 4px 0' : '0'};
            opacity: 0.85;
          "
          title={seg.name}
        ></div>
      {:else}
        <div
          style="
            width: {pct(seg)}%;
            background-color: #e4e1db;
            flex-shrink: 0;
            border-radius: {i === 0 ? '4px 0 0 4px' : i === segments.length - 1 ? '0 4px 4px 0' : '0'};
          "
        ></div>
      {/if}
    {/each}
  </div>

  <!-- Today marker: a small tick that extends above and below the bar -->
  {#if todayPct !== null}
    <div
      style="
        position: absolute;
        top: 0;
        left: {todayPct}%;
        transform: translateX(-50%);
        width: 2px;
        height: 13px;
        background-color: #1a1917;
        border-radius: 1px;
        pointer-events: none;
      "
      title="Vandaag"
    ></div>
  {/if}
</div>
