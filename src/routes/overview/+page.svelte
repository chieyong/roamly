<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import { trip, days, daysByLocation, activities, locations, addLocation, updateLocation, removeLocation, deleteActivity } from '$lib/stores/trip';
  import { draggingCityIdea } from '$lib/stores/ui';
  import type { Activity, Location } from '$lib/types';
  import MaybeList from '$lib/components/MaybeList.svelte';
  import TripOverviewMap from '$lib/components/TripOverviewMap.svelte';
  import DateRangePicker from '$lib/components/DateRangePicker.svelte';
  import CityInsertionZone from '$lib/components/CityInsertionZone.svelte';
  import CityDropOverlay   from '$lib/components/CityDropOverlay.svelte';

  let isDesktop = $state(false);
  let mq: MediaQueryList | undefined;

  onMount(() => {
    mq = window.matchMedia('(min-width: 1024px)');
    isDesktop = mq.matches;
    const handler = (e: MediaQueryListEvent) => { isDesktop = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq?.removeEventListener('change', handler);
  });

  // ── Auto-scroll during MaybeList drag ────────────────────────────────────────
  // When the user drags a city-idea card near the top of the viewport, the page
  // scrolls up automatically so off-screen city slots become reachable.

  let _dragPointerY = 0;
  let _scrollRaf: number | null = null;

  function _onDragPointerMove(e: PointerEvent) { _dragPointerY = e.clientY; }

  function _runAutoScroll() {
    if (!get(draggingCityIdea)) { _scrollRaf = null; return; }
    const vh = window.innerHeight;
    const ZONE  = 110; // px from edge where scroll kicks in
    const SPEED =  12; // max px per frame
    if (_dragPointerY < ZONE) {
      window.scrollBy(0, -SPEED * (1 - _dragPointerY / ZONE));
    } else if (_dragPointerY > vh - ZONE) {
      window.scrollBy(0,  SPEED * (1 - (vh - _dragPointerY) / ZONE));
    }
    _scrollRaf = requestAnimationFrame(_runAutoScroll);
  }

  $effect(() => {
    if ($draggingCityIdea) {
      window.addEventListener('pointermove', _onDragPointerMove);
      if (!_scrollRaf) _scrollRaf = requestAnimationFrame(_runAutoScroll);
    } else {
      window.removeEventListener('pointermove', _onDragPointerMove);
      if (_scrollRaf) { cancelAnimationFrame(_scrollRaf); _scrollRaf = null; }
    }
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Format a Date as YYYY-MM-DD using LOCAL date parts (avoids UTC timezone shift). */
  function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }

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

  function countDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end   + 'T00:00:00');
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
  }

  const colorOptions = [
    { cls: 'bg-teal-100',   hex: '#14b8a6' },
    { cls: 'bg-blue-100',   hex: '#3b82f6' },
    { cls: 'bg-amber-100',  hex: '#f59e0b' },
    { cls: 'bg-rose-100',   hex: '#f43f5e' },
    { cls: 'bg-purple-100', hex: '#a855f7' },
    { cls: 'bg-green-100',  hex: '#22c55e' },
  ];

  // ── Collapse / expand cities ─────────────────────────────────────────────────

  /** IDs of cities that are expanded. Starts empty = all collapsed. */
  let expandedCities = $state<Set<string>>(new Set());

  function toggleCity(id: string) {
    const next = new Set(expandedCities);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    expandedCities = next;
  }

  function expandAll() {
    expandedCities = new Set($locations.map(l => l.id));
  }

  function collapseAll() {
    expandedCities = new Set();
  }

  const allExpanded = $derived(expandedCities.size === $locations.length && $locations.length > 0);

  // ── Inline "Stad toevoegen" form ─────────────────────────────────────────────

  let addCityOpen  = $state(false);
  let newCityName  = $state('');
  let newCityStart = $state('');
  let newCityEnd   = $state('');
  let newCityColor = $state('bg-teal-100');

  function nextAvailableColor(): string {
    const used = get(locations).map((l) => l.color);
    return colorOptions.find((c) => !used.includes(c.cls))?.cls ?? colorOptions[0].cls;
  }

  function openAddCity() {
    newCityName  = '';
    newCityStart = '';
    newCityEnd   = '';
    newCityColor = nextAvailableColor();
    editingLocationId = null;
    deletingLocationId = null;
    addCityOpen  = true;
  }

  function cancelAddCity() {
    addCityOpen = false;
  }

  const newCityValid = $derived(
    newCityName.trim().length > 0 && !!newCityStart && !!newCityEnd && newCityStart < newCityEnd
  );

  function saveNewCity() {
    if (!newCityValid) return;
    addLocation({
      id:        `loc-${Date.now()}`,
      tripId:    get(trip).id,
      name:      newCityName.trim(),
      country:   '',
      emoji:     '',
      startDate: newCityStart,
      endDate:   newCityEnd,
      color:     newCityColor,
    });
    addCityOpen = false;
  }

  // ── Inline edit/delete city ──────────────────────────────────────────────────

  /** Occupied date ranges for the DateRangePicker — all OTHER cities' ranges, with their hex color. */
  const occupiedRanges = $derived(
    $locations
      .filter(l => l.id !== editingLocationId)   // exclude city being edited
      .map(l => ({ start: l.startDate, end: l.endDate, color: cityColor(l.color) }))
  );

  let editingLocationId  = $state<string | null>(null);
  let deletingLocationId = $state<string | null>(null);

  let editName  = $state('');
  let editStart = $state('');
  let editEnd   = $state('');
  let editColor = $state('bg-teal-100');

  function openEditCity(loc: Location) {
    addCityOpen        = false;
    deletingLocationId = null;
    editingLocationId  = loc.id;
    editName  = loc.name;
    editStart = loc.startDate;
    editEnd   = loc.endDate;
    editColor = loc.color;
  }

  function cancelEditCity() {
    editingLocationId = null;
  }

  const editCityValid = $derived(
    editName.trim().length > 0 && !!editStart && !!editEnd && editStart < editEnd
  );

  function saveEditCity() {
    if (!editCityValid || !editingLocationId) return;
    const orig = get(locations).find((l) => l.id === editingLocationId);
    if (!orig) return;
    updateLocation({
      ...orig,
      name:      editName.trim(),
      startDate: editStart,
      endDate:   editEnd,
      color:     editColor,
    });
    editingLocationId = null;
  }

  function askDeleteCity(id: string) {
    editingLocationId = null;
    deletingLocationId = id;
  }

  function confirmDeleteCity() {
    if (!deletingLocationId) return;
    removeLocation(deletingLocationId);
    deletingLocationId = null;
  }

  // ── Drag-to-reorder cities ────────────────────────────────────────────────────

  type CityCard = { id: string; name: string; color: string; startDate: string; endDate: string };
  let cityCards        = $state<CityCard[]>([]);
  let isCityDragging   = $state(false);
  // Long-press drag: starts disabled; enabled after ~350 ms hold on the city header row.
  let cityDragEnabled  = $state(false);
  // Which city is "activating" (visual feedback during the hold countdown)
  let activatingCityId = $state<string | null>(null);
  // Reference to the dndzone container so we can re-dispatch the synthetic pointerdown
  let dndzoneContainerEl: HTMLElement | undefined;

  /**
   * Long-press handler for the city header row.
   * Holds for LONG_PRESS_MS ms; if the pointer moves > 8 px in that time,
   * the gesture is treated as a scroll and the drag is NOT activated.
   * After the hold, `cityDragEnabled` is set to true and a synthetic
   * PointerEvent is dispatched on the dndzone container so it can start
   * the drag even though the initial pointerdown happened while dragDisabled=true.
   */
  // Long-press for touch (350ms), direct drag for mouse
  const LONG_PRESS_MS = 350;

  function onCityHeaderPointerDown(e: PointerEvent, cardId: string) {
    if (cityDragEnabled || isCityDragging) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let cancelled = false;

    // Mouse: geen wachttijd — direct starten
    const delayMs = e.pointerType === 'mouse' ? 0 : LONG_PRESS_MS;

    if (delayMs === 0) {
      // Direct drag voor desktop
      activatingCityId = null;
      cityDragEnabled  = true;
      requestAnimationFrame(() => {
        if (!dndzoneContainerEl) return;
        const synth = new PointerEvent('pointerdown', {
          bubbles: true, cancelable: true, composed: true,
          pointerId:   e.pointerId,
          pointerType: e.pointerType,
          clientX:  startX,    clientY:  startY,
          screenX:  e.screenX, screenY:  e.screenY,
          isPrimary: e.isPrimary,
          pressure: 0.5,
          button: 0, buttons: 1,
        });
        dndzoneContainerEl.dispatchEvent(synth);
      });
      return;
    }

    // Touch: long-press met bewegingsdrempel
    activatingCityId = cardId;

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      activatingCityId = null;
      clearTimeout(timer);
      if (!isCityDragging) cityDragEnabled = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointercancel', cancel);
    };

    const onMove = (me: PointerEvent) => {
      if (me.pointerId !== e.pointerId) return;
      const dist = Math.sqrt((me.clientX - startX) ** 2 + (me.clientY - startY) ** 2);
      if (dist > 8) cancel();
    };

    const onUp = () => cancel();

    const timer = setTimeout(() => {
      if (cancelled) return;
      activatingCityId = null;
      cityDragEnabled  = true;
      requestAnimationFrame(() => {
        if (!dndzoneContainerEl || !cityDragEnabled) return;
        const synth = new PointerEvent('pointerdown', {
          bubbles: true, cancelable: true, composed: true,
          pointerId:   e.pointerId,
          pointerType: e.pointerType,
          clientX:  startX,    clientY:  startY,
          screenX:  e.screenX, screenY:  e.screenY,
          isPrimary: e.isPrimary,
          pressure: 0.5,
          button: 0, buttons: 1,
        });
        dndzoneContainerEl.dispatchEvent(synth);
      });
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointercancel', cancel);
    }, delayMs);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp, { once: true });
    window.addEventListener('pointercancel', cancel, { once: true });
  }

  // Sync cityCards from store when not actively dragging
  $effect(() => {
    if (!isCityDragging) {
      cityCards = [...$locations]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map(loc => ({ id: loc.id, name: loc.name, color: loc.color, startDate: loc.startDate, endDate: loc.endDate }));
    }
  });

  function handleCitySectionConsider(e: CustomEvent) {
    isCityDragging = true;
    activatingCityId = null;
    cityCards = e.detail.items;
  }

  function handleCitySectionFinalize(e: CustomEvent) {
    const newCards: CityCard[] = e.detail.items;

    // Recalculate all dates: preserve each city's original duration, sequential from trip start
    let currentDate = $trip.startDate;
    const recalculated = newCards.map(card => {
      const origLoc = get(locations).find(l => l.id === card.id);
      const duration = origLoc ? countDays(origLoc.startDate, origLoc.endDate) : 3;
      const startDate = currentDate;
      const endDateObj = new Date(startDate + 'T00:00:00');
      endDateObj.setDate(endDateObj.getDate() + Math.max(1, duration));
      const endDate = localDateStr(endDateObj);
      currentDate = endDate;
      return { ...card, startDate, endDate };
    });

    // Build activity migration map BEFORE updateLocation regenerates days.
    // For each city whose dates change, positionally map old day IDs → new day IDs.
    const dayMigrations = new Map<string, string>();
    for (const newCard of recalculated) {
      const origLoc = get(locations).find(l => l.id === newCard.id);
      if (!origLoc) continue;
      if (origLoc.startDate === newCard.startDate && origLoc.endDate === newCard.endDate) continue;

      // Old days sorted by date (position 0 = first day of stay)
      const oldDays = get(days)
        .filter(d => d.locationId === newCard.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      // New day IDs that generateDaysForLocation will create
      const newDayIds: string[] = [];
      const endDate = new Date(newCard.endDate + 'T00:00:00');
      let cur = new Date(newCard.startDate + 'T00:00:00');
      while (cur < endDate) {
        newDayIds.push(`day-${newCard.id}-${localDateStr(cur)}`);
        cur.setDate(cur.getDate() + 1);
      }

      // Map old → new by position (day 1 of old stay → day 1 of new stay, etc.)
      for (let i = 0; i < Math.min(oldDays.length, newDayIds.length); i++) {
        if (oldDays[i].id !== newDayIds[i]) {
          dayMigrations.set(oldDays[i].id, newDayIds[i]);
        }
      }
    }

    // Apply location date changes: last → first to prevent resolveConflicts cascade conflicts
    const reversed = [...recalculated].reverse();
    for (const card of reversed) {
      const orig = get(locations).find(l => l.id === card.id);
      if (orig && (orig.startDate !== card.startDate || orig.endDate !== card.endDate)) {
        updateLocation({ ...orig, startDate: card.startDate, endDate: card.endDate });
      }
    }

    // Migrate activity dayIds to their new values (preserves planned activities after reorder)
    if (dayMigrations.size > 0) {
      activities.update(all => all.map(a => {
        const newDayId = dayMigrations.get(a.dayId);
        return newDayId ? { ...a, dayId: newDayId } : a;
      }));
    }

    isCityDragging  = false;
    cityDragEnabled = false;
  }

  // ── Drop city idea from Maybe List at any position ────────────────────────────

  function insertCityAt(activity: Activity, beforeLocationId: string | undefined) {
    // Activity is already deleted from maybe list by MaybeList's handleFinalize.
    // Call again to be safe (idempotent).
    deleteActivity(activity.id);

    const sortedLocs = [...get(locations)].sort((a, b) => a.startDate.localeCompare(b.startDate));

    // Determine the start date for the new city based on its target slot
    let startDate: string;
    if (beforeLocationId === undefined) {
      // Append at the end
      const lastLoc = sortedLocs[sortedLocs.length - 1];
      startDate = lastLoc?.endDate ?? $trip.startDate;
    } else {
      const idx = sortedLocs.findIndex(l => l.id === beforeLocationId);
      if (idx === 0) {
        // Before the first city — use the trip's start date
        startDate = $trip.startDate;
      } else {
        // Between idx-1 and idx — start right after the preceding city
        startDate = sortedLocs[idx - 1].endDate;
      }
    }

    const endDateObj = new Date(startDate + 'T00:00:00');
    endDateObj.setDate(endDateObj.getDate() + 3);
    const endDate = localDateStr(endDateObj);

    const color    = nextAvailableColor();
    const newLocId = `loc-${Date.now()}`;

    // addLocation internally calls resolveConflicts which cascades downstream dates.
    addLocation({
      id:        newLocId,
      tripId:    get(trip).id,
      name:      activity.title,
      country:   '',
      emoji:     '',
      startDate,
      endDate,
      color,
    });

    // Explicit safety cascade: ensure every city after the new one has sequential dates.
    // resolveConflicts should already handle this, but this guarantees it even for edge cases.
    cascadeAfterInsert(newLocId);

    // Open the inline edit form so the user can adjust dates if needed
    addCityOpen        = false;
    deletingLocationId = null;
    editingLocationId  = newLocId;
    editName  = activity.title;
    editStart = startDate;
    editEnd   = endDate;
    editColor = color;
  }

  /**
   * After inserting a new city, re-verify that every city AFTER it has
   * strictly sequential dates (no overlaps). Applies corrections last→first
   * so updateLocation's own resolveConflicts doesn't fight back.
   */
  /**
   * Returns all dates [gapStart … gapEnd) as YYYY-MM-DD strings.
   * Used to render unassigned days between two cities.
   */
  function gapDays(gapStart: string, gapEnd: string): string[] {
    const result: string[] = [];
    const cur = new Date(gapStart + 'T00:00:00');
    const end = new Date(gapEnd   + 'T00:00:00');
    while (cur < end) {
      result.push(localDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  /**
   * One-line summary for a day: "Wijk · Activiteit 1, Activiteit 2"
   * Shown in the Reis-page day row next to the date.
   */
  function daySummary(dayId: string): string {
    const sectionOrder: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
    const acts = $activities
      .filter(a => a.dayId === dayId && a.section !== 'maybe')
      .sort((a, b) => {
        const sd = (sectionOrder[a.section] ?? 99) - (sectionOrder[b.section] ?? 99);
        return sd !== 0 ? sd : a.order - b.order;
      });
    if (acts.length === 0) return '';
    const hood  = acts[0]?.location ?? '';
    const names = acts.slice(0, 2).map(a => a.title).join(' · ');
    return hood ? `${hood} · ${names}` : names;
  }

  function cascadeAfterInsert(newLocId: string) {
    const sorted = [...get(locations)].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const newIdx = sorted.findIndex(l => l.id === newLocId);
    if (newIdx === -1) return;

    let cursor  = sorted[newIdx].endDate;
    const fixes: Location[] = [];

    for (let i = newIdx + 1; i < sorted.length; i++) {
      const loc = sorted[i];
      if (loc.startDate < cursor) {
        const duration = Math.max(1, countDays(loc.startDate, loc.endDate));
        const newStart  = cursor;
        const endObj    = new Date(newStart + 'T00:00:00');
        endObj.setDate(endObj.getDate() + duration);
        const newEnd    = localDateStr(endObj);
        cursor = newEnd;
        fixes.push({ ...loc, startDate: newStart, endDate: newEnd });
      } else {
        cursor = loc.endDate;
      }
    }

    // Apply last → first so each updateLocation's resolveConflicts doesn't undo the next fix
    for (const fix of [...fixes].reverse()) {
      updateLocation(fix);
    }
  }
</script>

<!-- ── Header ─────────────────────────────────────────────────────────────── -->
<div class="mb-10">
  <h1 class="text-2xl font-semibold" style="color: var(--clr-text, #1a1917); letter-spacing: -0.02em; font-family: var(--font-header);">
    {$trip.name}
  </h1>
  <p class="text-sm mt-1" style="color: var(--clr-muted, #a09e98);">
    {formatDateShort($trip.startDate)} – {formatDateShort($trip.endDate)}
    <span class="mx-1.5" style="color: var(--clr-border, #d4d1c8);">·</span>
    {tripDays()} dagen
  </p>
</div>

<!-- ── Main grid ──────────────────────────────────────────────────────────── -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:pb-0" style="padding-bottom: 160px;">

  <!-- Timeline -->
  <div class="lg:col-span-2">

    <!-- ── Expand / collapse all ─────────────────────────────────────────────── -->
    {#if $locations.length > 0}
      <div class="flex justify-end mb-3">
        <button
          onclick={allExpanded ? collapseAll : expandAll}
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
          style="color: var(--clr-muted, #8b8a84); background: var(--clr-surface-alt, #f0eeea);"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e4e1db'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt, #f0eeea)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            {#if allExpanded}
              <path d="M2 4l4-3 4 3M2 9l4-3 4 3"/>
            {:else}
              <path d="M2 3l4 3 4-3M2 8l4 3 4-3"/>
            {/if}
          </svg>
          {allExpanded ? 'Alles inklappen' : 'Alles uitklappen'}
        </button>
      </div>
    {/if}

    <!-- ── City sections: DnD-sortable (issue 3) ──────────────────────────────── -->
    <div
      bind:this={dndzoneContainerEl}
      use:dndzone={{ items: cityCards, type: 'planning-city', dropTargetStyle: {}, flipDurationMs: 250, dragDisabled: !cityDragEnabled }}
      onconsider={handleCitySectionConsider}
      onfinalize={handleCitySectionFinalize}
      class="space-y-0"
      role="list"
    >
      {#each cityCards as cityCard, sectionIdx (cityCard.id)}
        {@const location = $locations.find(l => l.id === cityCard.id)}
        {@const locationDays = location
          ? $days.filter(d => d.locationId === location.id).sort((a, b) => a.date.localeCompare(b.date))
          : []}
        {@const nextCard = cityCards[sectionIdx + 1]}
        {@const nextLocation = nextCard ? $locations.find(l => l.id === nextCard.id) : null}
        {@const hasTravelDay = !!(location && nextLocation && location.endDate === nextLocation.startDate)}
        {@const displayDays = locationDays.length + (hasTravelDay ? 1 : 0)}
        {@const displayNights = Math.max(0, locationDays.length - 1 + (hasTravelDay ? 1 : 0))}

        <!-- position:relative lets CityDropOverlay be absolute-positioned inside -->
        <div animate:flip={{ duration: 250 }} class="mb-8" style="position: relative;">

          {#if location && (locationDays.length > 0 || editingLocationId === location.id)}
            <!-- Full-size drop overlay: visible when dragging a city idea from Maybe List -->
            {#if $draggingCityIdea}
              <CityDropOverlay beforeLocationId={location.id} cityName={location.name} onInsert={insertCityAt} />
            {/if}

            <!-- City header row: long-press anywhere here to start dragging -->
            <div
              class="flex items-center gap-1.5 mb-1 group"
              onpointerdown={editingLocationId !== location.id
                ? (e) => onCityHeaderPointerDown(e, cityCard.id)
                : undefined}
              style="
                touch-action: none;
                user-select: none;
                cursor: {editingLocationId === location.id ? 'default' : 'grab'};
                border-radius: 8px;
                transition: background-color 0.15s;
                background-color: {activatingCityId === cityCard.id ? cityBadge(location.color) : 'transparent'};
                padding: 2px 4px 2px 0;
                margin: -2px -4px -2px 0;
              "
            >
              <!-- Drag handle dots: sleep om stad te verplaatsen -->
              <div
                class="opacity-30 lg:opacity-0 lg:group-hover:opacity-50 flex-shrink-0 transition-opacity pointer-events-none"
                style="color: #a09e98; padding: 2px;"
                title="Sleep om stad te verplaatsen"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5.5" cy="4" r="1.2"/>
                  <circle cx="5.5" cy="8" r="1.2"/>
                  <circle cx="5.5" cy="12" r="1.2"/>
                  <circle cx="10.5" cy="4" r="1.2"/>
                  <circle cx="10.5" cy="8" r="1.2"/>
                  <circle cx="10.5" cy="12" r="1.2"/>
                </svg>
              </div>

              <!-- Expand/collapse toggle chevron (klikbaar) -->
              <button
                onclick={() => { toggleCity(location.id); if (editingLocationId) cancelEditCity(); }}
                onpointerdown={(e) => e.stopPropagation()}
                class="flex-shrink-0 w-6 h-6 flex items-center justify-center"
                style="background: none; border: none; cursor: pointer; color: {cityColor(location.color)}; padding: 0;"
                tabindex="-1"
                aria-hidden="true"
              >
                <svg
                  width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"
                  style="transition: transform 0.2s; transform: {expandedCities.has(location.id) ? 'rotate(0deg)' : 'rotate(-90deg)'};"
                >
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>

              <!-- Stadsrij: klikken = uitklappen/inklappen -->
              <button
                onclick={() => { toggleCity(location.id); if (editingLocationId) cancelEditCity(); }}
                onpointerdown={(e) => e.stopPropagation()}
                class="flex items-center gap-2 flex-1 text-left"
                style="background: none; border: none; cursor: pointer; padding: 2px 0;"
                title={expandedCities.has(location.id) ? 'Inklappen' : 'Uitklappen'}
              >
                <div
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style="background-color: {cityColor(location.color)};"
                ></div>
                <span class="text-xs font-semibold" style="color: var(--clr-text, #1a1917);">
                  {location.name}
                </span>
                <span class="text-xs" style="color: var(--clr-muted, #a09e98);">
                  {formatDateShort(location.startDate)} – {formatDateShort(location.endDate)}
                  · {displayDays} {displayDays === 1 ? 'dag' : 'dagen'}
                </span>
              </button>

              <!-- Potlood: verschijnt als stad open is, opent bewerkmodus -->
              {#if expandedCities.has(location.id)}
                <button
                  onclick={(e) => { e.stopPropagation(); editingLocationId === location.id ? cancelEditCity() : openEditCity(location); }}
                  onpointerdown={(e) => e.stopPropagation()}
                  class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style="color: #a09e98; background: none; border: none; cursor: pointer;"
                  title="Bewerken"
                  onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = cityBadge(location.color); (e.currentTarget as HTMLElement).style.color = cityColor(location.color); }}
                  onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#a09e98'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/>
                  </svg>
                </button>
              {/if}
            </div>

            <!-- Delete confirmation -->
            {#if deletingLocationId === location.id}
              <div
                class="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                style="background: #fff1f2; border: 1px solid #fecdd3;"
              >
                <span class="text-xs flex-1" style="color: #be123c;">
                  {location.name} verwijderen? Activiteiten gaan naar de misschien-lijst.
                </span>
                <button
                  onclick={confirmDeleteCity}
                  class="text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0"
                  style="background: #f43f5e; color: white;"
                >Verwijder</button>
                <button
                  onclick={() => { deletingLocationId = null; }}
                  class="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                  style="color: #a09e98; background: var(--clr-surface-alt, #f4f3ef);"
                >Annuleer</button>
              </div>
            {/if}

            {#if editingLocationId === location.id}
              <!-- Inline edit form -->
              <div
                class="rounded-2xl p-4 space-y-3 mb-2"
                style="border: 1.5px solid var(--clr-accent, #0d9488); background: var(--clr-accent-light, #f0fdfa);"
              >
                <div>
                  <label class="text-xs block mb-1" style="color: var(--clr-muted, #8b8a84);">Stadnaam</label>
                  <input
                    type="text"
                    bind:value={editName}
                    placeholder="bijv. Nara"
                    class="w-full text-sm rounded-xl px-3 py-2 outline-none"
                    style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
                  />
                </div>
                <div>
                  <label class="text-xs block mb-1.5" style="color: var(--clr-muted, #8b8a84);">Periode</label>
                  <div class="rounded-xl p-3" style="background: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0);">
                    <DateRangePicker bind:startDate={editStart} bind:endDate={editEnd} occupiedRanges={occupiedRanges} />
                  </div>
                </div>
                {#if editStart && editEnd && editStart >= editEnd}
                  <p class="text-xs" style="color: #f43f5e;">Vertrekdatum moet na aankomst liggen</p>
                {/if}
                <div>
                  <p class="text-xs mb-1.5" style="color: var(--clr-muted, #8b8a84);">Kleur</p>
                  <div class="flex gap-2">
                    {#each colorOptions as opt}
                      <button
                        onclick={() => { editColor = opt.cls; }}
                        class="w-7 h-7 rounded-full transition-all"
                        style="background: {opt.hex}; border: 2.5px solid {editColor === opt.cls ? '#1a1917' : 'transparent'}; box-shadow: {editColor === opt.cls ? '0 0 0 1px white inset' : 'none'};"
                        aria-label={opt.cls}
                      ></button>
                    {/each}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    onclick={saveEditCity}
                    disabled={!editCityValid}
                    class="flex-1 text-xs py-2 rounded-xl font-medium transition-all"
                    style="background-color: {editCityValid ? '#0d9488' : '#d4d1c8'}; color: white;"
                  >Opslaan</button>
                  <button
                    onclick={cancelEditCity}
                    class="text-xs px-4 py-2 rounded-xl"
                    style="color: var(--clr-muted, #8b8a84); background: var(--clr-surface-alt, #f4f3ef);"
                  >Annuleren</button>
                  <button
                    onclick={() => askDeleteCity(location.id)}
                    class="text-xs px-3 py-2 rounded-xl"
                    style="color: #f43f5e; background: #fff1f2;"
                    title="Verwijder bestemming"
                  >🗑</button>
                </div>
              </div>
            {:else if expandedCities.has(location.id)}
              {@const travelDay = hasTravelDay && nextLocation ? $days.find(d => d.id === `day-${location.id}-${nextLocation.startDate}`) ?? null : null}

              <!-- Day rows -->
              <div class="flex flex-col" style="margin-left: 4px; margin-bottom: 4px;">
                {#each locationDays as day, i}
                  {@const depLoc = day.departureLocationId ? $locations.find(l => l.id === day.departureLocationId) : null}
                  {@const hasActivities = !!topActivity(day.id)}
                  {@const summary = hasActivities ? daySummary(day.id) : ''}
                  <button
                    onclick={() => goto(`/day/${day.id}`)}
                    onpointerdown={(e) => e.stopPropagation()}
                    class="group flex items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors rounded-r-xl"
                    style="border-left: 3px solid {cityColor(location.color)}; background-color: transparent; touch-action: manipulation;"
                    onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = cityBadge(location.color); }}
                    onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-xs flex-shrink-0 tabular-nums" style="color: var(--clr-muted, #8b8a84); min-width: 80px;">
                        {formatDayRow(day.date)}
                      </span>
                      {#if depLoc}
                        <!-- Travel day: route indicator -->
                        <span class="text-xs flex items-center gap-1.5 flex-shrink-0" style="color: #9b9895;">
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 7h12M9 3l4 4-4 4"/>
                          </svg>
                          {depLoc.name}
                          <span style="color: #d4d1c8;">→</span>
                          {location.name}
                        </span>
                      {:else if hasActivities}
                        <!-- Day summary: wijk (bold) · activiteiten -->
                        {@const parts = summary.split(' · ')}
                        <span class="text-xs truncate" style="color: var(--clr-subtle, #8b8a84);">
                          {#if parts.length > 1}
                            <strong style="font-weight: 600; color: var(--clr-text, #1a1917);">{parts[0]}</strong>{' · ' + parts.slice(1).join(' · ')}
                          {:else}
                            {summary}
                          {/if}
                        </span>
                      {:else}
                        <!-- No activities yet -->
                        <span class="text-xs" style="color: #c5c2bc; font-style: italic;">Nog niets gepland</span>
                      {/if}
                    </div>
                    <svg
                      class="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style="color: {cityColor(location.color)};"
                      viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"
                    >
                      <path d="M5 2.5l4.5 4.5L5 11.5"/>
                    </svg>
                  </button>
                  {#if i < locationDays.length - 1}
                    <div style="height: 1px; margin-left: 16px; background-color: var(--clr-border-light, #f0eeea);"></div>
                  {/if}
                {/each}

                <!-- Travel departure row (shared day between Stad A → Stad B) -->
                {#if hasTravelDay && nextLocation}
                  {@const sharedDay = $days.find(d => d.locationId === nextLocation.id && d.date === nextLocation.startDate)}
                  {#if sharedDay}
                    <div style="height: 1px; margin-left: 16px; background: repeating-linear-gradient(90deg, #f0eeea 0px, #f0eeea 4px, transparent 4px, transparent 8px);"></div>
                    <button
                      onclick={() => goto(`/day/${sharedDay.id}`)}
                      onpointerdown={(e) => e.stopPropagation()}
                      class="group flex items-center justify-between gap-4 px-4 py-2.5 text-left w-full transition-colors rounded-r-xl"
                      style="border-left: 3px solid {cityColor(location.color)}; background-color: transparent; touch-action: manipulation;"
                      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = cityBadge(location.color); }}
                      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="text-xs flex-shrink-0 tabular-nums" style="color: var(--clr-muted, #8b8a84); min-width: 80px;">
                          {formatDayRow(sharedDay.date)}
                        </span>
                        <span class="text-xs flex items-center gap-1.5" style="color: #9b9895;">
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 7h12M9 3l4 4-4 4"/>
                          </svg>
                          {location.name}
                          <span style="color: #d4d1c8;">→</span>
                          {nextLocation.name}
                        </span>
                      </div>
                      <svg
                        class="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style="color: {cityColor(location.color)};"
                        viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"
                      >
                        <path d="M5 2.5l4.5 4.5L5 11.5"/>
                      </svg>
                    </button>
                  {/if}
                {/if}
              </div>
            {/if}
          {/if}

          <!-- Gap block: unassigned days between this city and the next -->
          {#if location && nextLocation && location.endDate < nextLocation.startDate}
            <div style="margin-left: 4px; margin-top: 2px;">
              {#each gapDays(location.endDate, nextLocation.startDate) as gapDate}
                <div
                  class="flex items-center gap-3 px-4 py-2.5 rounded-r-xl"
                  style="border-left: 3px dashed #d4d1c8; margin-bottom: 1px;"
                >
                  <span class="text-xs tabular-nums flex-shrink-0" style="color: #c5c2bc; min-width: 80px;">
                    {formatDayRow(gapDate)}
                  </span>
                  <span class="text-xs" style="color: #d4d1c8; font-style: italic;">Geen stad gepland</span>
                </div>
              {/each}
            </div>
          {/if}

        </div>
      {/each}
    </div>
    <!-- End DnD sortable city list -->

    <!-- Insertion zone at the very end (issue 2) -->
    {#if $draggingCityIdea}
      <CityInsertionZone onInsert={insertCityAt} />
    {/if}

    <!-- ── Inline "Stad toevoegen" ──────────────────────────────────────────── -->
    {#if addCityOpen}
      <div
        class="rounded-2xl p-4 space-y-3"
        style="border: 1.5px dashed var(--clr-accent, #0d9488); background: var(--clr-accent-light, #f0fdfa);"
      >
        <!-- Naam -->
        <div>
          <label class="text-xs block mb-1" style="color: var(--clr-muted, #8b8a84);">Stadnaam</label>
          <input
            type="text"
            bind:value={newCityName}
            placeholder="bijv. Nara"
            autofocus
            class="w-full text-sm rounded-xl px-3 py-2 outline-none"
            style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
          />
        </div>

        <!-- Periode (kalender) -->
        <div>
          <label class="text-xs block mb-1.5" style="color: var(--clr-muted, #8b8a84);">Periode</label>
          <div class="rounded-xl p-3" style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0);">
            <DateRangePicker bind:startDate={newCityStart} bind:endDate={newCityEnd} occupiedRanges={occupiedRanges} />
          </div>
        </div>

        {#if newCityStart && newCityEnd && newCityStart >= newCityEnd}
          <p class="text-xs" style="color: #f43f5e;">Vertrekdatum moet na aankomst liggen</p>
        {/if}

        <!-- Kleur -->
        <div>
          <p class="text-xs mb-1.5" style="color: var(--clr-muted, #8b8a84);">Kleur</p>
          <div class="flex gap-2">
            {#each colorOptions as opt}
              <button
                onclick={() => { newCityColor = opt.cls; }}
                class="w-7 h-7 rounded-full transition-all"
                style="background: {opt.hex}; border: 2.5px solid {newCityColor === opt.cls ? '#1a1917' : 'transparent'}; box-shadow: {newCityColor === opt.cls ? '0 0 0 1px white inset' : 'none'};"
                aria-label={opt.cls}
              ></button>
            {/each}
          </div>
        </div>

        <!-- Knoppen -->
        <div class="flex gap-2">
          <button
            onclick={saveNewCity}
            disabled={!newCityValid}
            class="flex-1 text-xs py-2 rounded-xl font-medium transition-all"
            style="background-color: {newCityValid ? '#0d9488' : '#d4d1c8'}; color: white;"
          >Stad opslaan</button>
          <button
            onclick={cancelAddCity}
            class="text-xs px-4 py-2 rounded-xl"
            style="color: var(--clr-muted, #8b8a84); background: var(--clr-surface-alt, #f4f3ef);"
          >Annuleren</button>
        </div>
      </div>
    {:else}
      <button
        onclick={openAddCity}
        class="w-full flex items-center justify-center gap-2 text-xs py-3 rounded-2xl font-medium transition-all"
        style="border: 1.5px dashed #d4d1c8; color: #8b8a84;"
        onmouseenter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#0d9488';
          (e.currentTarget as HTMLElement).style.color = '#0d9488';
        }}
        onmouseleave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#d4d1c8';
          (e.currentTarget as HTMLElement).style.color = '#8b8a84';
        }}
      >
        + Stad toevoegen
      </button>
    {/if}
  </div>

  <!-- Sidebar: kaart (desktop) + Maybe list -->
  <div class="lg:col-span-1">
    <div class="lg:sticky space-y-4" style="top: 72px;">
      <!-- Overzichtskaart — alleen op desktop in sidebar -->
      {#if isDesktop}
        <div style="height: 220px; border-radius: 18px; overflow: hidden; border: 1px solid var(--clr-border, #e8e6e0); box-shadow: 0 2px 12px rgba(0,0,0,0.06); background-color: var(--clr-surface-alt, #f4f3ef);">
          <TripOverviewMap locations={$locations} />
        </div>
      {/if}
      <MaybeList />
    </div>
  </div>
</div>

<!-- ── Overzichtskaart: fixed onderaan op mobiel ──────────────────────────── -->
{#if !isDesktop}
  <div style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; padding: 0 12px 14px;">
    <div
      style="
        height: 140px;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(232,230,224,0.8);
        box-shadow: 0 -4px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
        background-color: var(--clr-surface-alt, #f4f3ef);
      "
    >
      <TripOverviewMap locations={$locations} />
    </div>
  </div>
{/if}
