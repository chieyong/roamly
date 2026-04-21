<script lang="ts">
  import { goto } from '$app/navigation';
  import { trip, locations, days } from '$lib/stores/trip';

  /**
   * Optional date to show as the marker tick (YYYY-MM-DD).
   * On day pages this is the currently open day → "you are here".
   * Falls back to today when not provided (home page / standalone use).
   */
  let { markerDate = null }: { markerDate?: string | null } = $props();

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

  // All days sorted — used for drag-to-navigate
  const sortedDays = $derived([...$days].sort((a, b) => a.date.localeCompare(b.date)));

  // Marker position: use the provided markerDate, otherwise fall back to today.
  const activeDate = $derived(markerDate ?? new Date().toISOString().slice(0, 10));
  const markerPct  = $derived(
    activeDate >= $trip.startDate && activeDate < $trip.endDate
      ? (daysBetween($trip.startDate, activeDate) / totalDays) * 100
      : null
  );

  function pct(seg: Segment): string {
    return ((seg.days / totalDays) * 100).toFixed(3);
  }

  // ── Drag-to-navigate ──────────────────────────────────────────────────────────

  let barEl: HTMLElement | undefined;
  let isDragging  = $state(false);
  let dragPct     = $state<number | null>(null);  // live drag position (0–100)
  let previewDay  = $state<string | null>(null);  // label shown while dragging

  /** Convert a percentage (0–100) along the bar to the closest navigable day. */
  function dayAtPct(pctVal: number): { id: string; date: string } | null {
    if (sortedDays.length === 0 || totalDays === 0) return null;
    const clampedPct = Math.max(0, Math.min(99.9, pctVal));
    // Days into the trip this pct represents
    const daysIn = (clampedPct / 100) * totalDays;
    const targetDate = new Date($trip.startDate + 'T00:00:00');
    targetDate.setDate(targetDate.getDate() + Math.floor(daysIn));
    // Use local date parts to avoid UTC timezone offset shifting to the previous day
    const y = targetDate.getFullYear();
    const mo = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dy = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${mo}-${dy}`;
    // Find closest day on or after this date
    return sortedDays.find(d => d.date >= dateStr) ?? sortedDays[sortedDays.length - 1];
  }

  function pctFromPointer(e: PointerEvent): number {
    if (!barEl) return 0;
    const rect = barEl.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  }

  function onMarkerPointerDown(e: PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    isDragging = true;
    dragPct    = markerPct;

    function onMove(ev: PointerEvent) {
      if (!isDragging) return;
      dragPct = pctFromPointer(ev);
      const d = dayAtPct(dragPct);
      previewDay = d ? formatDayLabel(d.date) : null;
    }

    function onUp(ev: PointerEvent) {
      if (!isDragging) return;
      const finalPct = pctFromPointer(ev);
      const d = dayAtPct(finalPct);
      isDragging = false;
      dragPct    = null;
      previewDay = null;
      if (d) goto(`/day/${d.id}`);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  function formatDayLabel(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // Display position: during drag show dragPct, otherwise markerPct
  const displayPct = $derived(isDragging ? (dragPct ?? markerPct) : markerPct);
</script>

<!--
  Compact horizontal trip timeline.
  Clicking the bar (outside the marker) navigates to /overview.
  Dragging the marker navigates to the corresponding day.
-->
<div
  bind:this={barEl}
  style="position: relative; padding: 6px 0; user-select: none;"
>
  <!-- Colored bar: click to navigate to the day at that position -->
  <div
    role="button"
    tabindex="0"
    title="Klik om naar die dag te gaan"
    onclick={(e) => {
      if (isDragging) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pctVal = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const d = dayAtPct(pctVal);
      if (d) goto(`/day/${d.id}`);
    }}
    onkeydown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
        const d = dayAtPct(markerPct ?? 0);
        if (d) goto(`/day/${d.id}`);
      }
    }}
    style="display: flex; height: 7px; border-radius: 4px; overflow: hidden; width: 100%; cursor: pointer; background-color: var(--clr-border, #e4e1db);"
  >
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
            background-color: var(--clr-border, #e4e1db);
            flex-shrink: 0;
          "
        ></div>
      {/if}
    {/each}
  </div>

  <!-- Draggable marker -->
  {#if displayPct !== null}
    <!-- Day label tooltip shown while dragging -->
    {#if isDragging && previewDay}
      <div
        style="
          position: absolute;
          bottom: 100%;
          left: {displayPct}%;
          transform: translateX(-50%);
          margin-bottom: 4px;
          background: #1a1917;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
        "
      >
        {previewDay}
      </div>
    {/if}

    <!-- The marker itself: draggable tick with larger hit area -->
    <div
      style="
        position: absolute;
        top: 0;
        left: {displayPct}%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: {isDragging ? 'grabbing' : 'grab'};
        z-index: 5;
        padding: 0 8px;
        margin: 0 -8px;
        touch-action: none;
      "
      title="Sleep om naar een andere dag te gaan"
      onpointerdown={onMarkerPointerDown}
    >
      <!-- Visible tick line -->
      <div
        style="
          width: {isDragging ? '3px' : '2px'};
          height: 19px;
          background-color: {isDragging ? '#0d9488' : '#1a1917'};
          border-radius: 1.5px;
          transition: width 0.1s, background-color 0.1s;
        "
      ></div>
    </div>
  {/if}
</div>
