<script lang="ts">
  import { goto } from '$app/navigation';
  import { trip, locations } from '$lib/stores/trip';
  import TripOverviewMap from '$lib/components/TripOverviewMap.svelte';

  // ── Color helpers ─────────────────────────────────────────────────────────────

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

  function formatDateShort(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── Timeline segments ─────────────────────────────────────────────────────────

  type Segment =
    | { type: 'city'; name: string; color: string; days: number; startDate: string }
    | { type: 'gap';  days: number };

  const totalDays = $derived(daysBetween($trip.startDate, $trip.endDate));

  const segments = $derived((() => {
    if (totalDays === 0) return [] as Segment[];
    const sorted = [...$locations].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const result: Segment[] = [];
    let cursor = $trip.startDate;
    for (const loc of sorted) {
      if (loc.startDate > cursor) {
        const g = daysBetween(cursor, loc.startDate);
        if (g > 0) result.push({ type: 'gap', days: g });
      }
      const d = daysBetween(loc.startDate, loc.endDate);
      if (d > 0) result.push({ type: 'city', name: loc.name, color: cityColor(loc.color), days: d, startDate: loc.startDate });
      if (loc.endDate > cursor) cursor = loc.endDate;
    }
    if (cursor < $trip.endDate) {
      const g = daysBetween(cursor, $trip.endDate);
      if (g > 0) result.push({ type: 'gap', days: g });
    }
    return result;
  })());

  function pct(days: number): string {
    return totalDays > 0 ? ((days / totalDays) * 100).toFixed(3) + '%' : '0%';
  }

  // ── Today marker ──────────────────────────────────────────────────────────────
  // Only visible when today falls within the trip period.

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPct = $derived(
    todayStr >= $trip.startDate && todayStr < $trip.endDate
      ? (daysBetween($trip.startDate, todayStr) / totalDays) * 100
      : null
  );
</script>

<!-- ── Minimal trip home ────────────────────────────────────────────────────── -->
<div style="display: flex; flex-direction: column; gap: 0; margin: -8px -0px;">

  <!-- Trip name + dates -->
  <div style="padding: 16px 0 20px;">
    <p class="text-xs" style="color: var(--clr-muted, #a09e98); margin-bottom: 2px;">Jouw reis</p>
    <h1 class="text-2xl font-semibold" style="color: var(--clr-text, #1a1917); letter-spacing: -0.02em; font-family: var(--font-header); margin-bottom: 4px;">
      {$trip.name}
    </h1>
    <p class="text-sm" style="color: var(--clr-muted, #a09e98);">
      {formatDateShort($trip.startDate)} – {formatDateShort($trip.endDate)}
    </p>
  </div>

  <!-- ── Clickable summary bar + labels ──────────────────────────────────────── -->
  <button
    onclick={() => goto('/overview')}
    title="Bekijk volledig reisoverzicht"
    style="
      width: 100%; padding: 0; border: none; background: none;
      cursor: pointer; text-align: left;
      margin-bottom: 20px;
    "
  >
    <!-- Colored bar -->
    <div style="position: relative; margin-bottom: 8px;">
      <div style="display: flex; height: 22px; border-radius: 11px; overflow: hidden; width: 100%;">
        {#each segments as seg, i}
          <div
            style="
              width: {pct(seg.days)};
              flex-shrink: 0;
              background-color: {seg.type === 'city' ? seg.color : '#e4e1db'};
              opacity: {seg.type === 'city' ? '1' : '1'};
              border-radius: {i === 0 ? '11px 0 0 11px' : i === segments.length - 1 ? '0 11px 11px 0' : '0'};
            "
            title={seg.type === 'city' ? seg.name : ''}
          ></div>
        {/each}
      </div>

      <!-- Today marker -->
      {#if todayPct !== null}
        <div
          style="
            position: absolute;
            top: -3px; bottom: -3px;
            left: {todayPct}%;
            transform: translateX(-50%);
            width: 2.5px;
            background-color: #1a1917;
            border-radius: 2px;
            pointer-events: none;
          "
          title="Vandaag"
        ></div>
      {/if}
    </div>

    <!-- City name labels below each segment -->
    <div style="display: flex; width: 100%; align-items: flex-start;">
      {#each segments as seg}
        <div
          style="
            width: {pct(seg.days)};
            flex-shrink: 0;
            font-size: 10px;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            padding: 0 2px;
            color: {seg.type === 'city' ? seg.color : 'transparent'};
            font-weight: 600;
            line-height: 1.3;
          "
        >
          {seg.type === 'city' ? seg.name : ''}
        </div>
      {/each}
    </div>
  </button>

  <!-- ── Clickable map ──────────────────────────────────────────────────────── -->
  <button
    onclick={() => goto('/overview')}
    title="Bekijk volledig reisoverzicht"
    style="
      width: 100%; padding: 0; border: none; background: none;
      cursor: pointer;
      border-radius: 20px;
      overflow: hidden;
      height: calc(100dvh - 260px);
      min-height: 260px;
      max-height: 640px;
      border: 1px solid var(--clr-border, #e8e6e0);
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    "
  >
    <TripOverviewMap locations={$locations} />
  </button>

  <!-- "Bekijk detailoverzicht" hint -->
  <div style="text-align: center; padding: 14px 0 4px;">
    <button
      onclick={() => goto('/overview')}
      class="text-xs"
      style="color: var(--clr-muted, #a09e98); background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
    >
      Bekijk volledig reisoverzicht
      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M5 2.5l4.5 4.5L5 11.5"/>
      </svg>
    </button>
  </div>

</div>
