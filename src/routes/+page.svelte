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

  // ── Drag-to-reorder cities (issue 3) ─────────────────────────────────────────

  type CityCard = { id: string; name: string; color: string; startDate: string; endDate: string };
  let cityCards = $state<CityCard[]>([]);
  let isCityDragging = $state(false);

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

    // Apply changes: update from LAST to FIRST to avoid resolveConflicts cascading incorrectly
    const reversed = [...recalculated].reverse();
    for (const card of reversed) {
      const orig = get(locations).find(l => l.id === card.id);
      if (orig && (orig.startDate !== card.startDate || orig.endDate !== card.endDate)) {
        updateLocation({ ...orig, startDate: card.startDate, endDate: card.endDate });
      }
    }

    isCityDragging = false;
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

    <!-- ── City sections: DnD-sortable (issue 3) ──────────────────────────────── -->
    <div
      use:dndzone={{ items: cityCards, type: 'planning-city', dropTargetStyle: {}, flipDurationMs: 250 }}
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

            <!-- City header row: left side = drag handle + dot + name; right side = edit chevron -->
            <div class="flex items-center gap-1.5 mb-2 group">
              <!-- Drag handle (only visible on hover) -->
              <div
                class="opacity-0 group-hover:opacity-40 hover:opacity-70 cursor-grab active:cursor-grabbing flex-shrink-0 transition-opacity"
                title="Versleep om volgorde te wijzigen"
                style="color: #a09e98; padding: 2px;"
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

              <!-- Clickable edit area -->
              <button
                onclick={() => editingLocationId === location.id ? cancelEditCity() : openEditCity(location)}
                class="flex items-center gap-2 flex-1 text-left"
                style="background: none; border: none; cursor: pointer; padding: 2px 0;"
                title="Klik om te bewerken of verwijderen"
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
                  · {displayNights} {displayNights === 1 ? 'overnachting' : 'overnachtingen'}
                </span>
                <svg
                  class="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                  width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#8b8a84" stroke-width="1.5"
                  style="transform: {editingLocationId === location.id ? 'rotate(180deg)' : 'rotate(0deg)'}; transition: transform 0.2s;"
                >
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
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
                    <DateRangePicker bind:startDate={editStart} bind:endDate={editEnd} />
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
            {:else}
              {@const travelDay = hasTravelDay && nextLocation ? $days.find(d => d.id === `day-${location.id}-${nextLocation.startDate}`) ?? null : null}

              <!-- Day rows -->
              <div class="flex flex-col" style="border-left: 3px solid {cityColor(location.color)}; margin-left: 4px;">
                {#each locationDays as day, i}
                  {@const preview = topActivity(day.id)}
                  {@const depLoc = day.departureLocationId ? $locations.find(l => l.id === day.departureLocationId) : null}
                  {@const isTravelDay = !!depLoc}
                  <button
                    onclick={() => goto(`/day/${day.id}`)}
                    class="group flex items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors rounded-r-xl"
                    style="background-color: {isTravelDay ? 'rgba(245,158,11,0.05)' : 'transparent'};"
                    onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isTravelDay ? 'rgba(245,158,11,0.10)' : cityBadge(location.color); }}
                    onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isTravelDay ? 'rgba(245,158,11,0.05)' : 'transparent'; }}
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-xs flex-shrink-0 tabular-nums" style="color: var(--clr-muted, #8b8a84); min-width: 80px;">
                        {formatDayRow(day.date)}
                      </span>
                      {#if depLoc}
                        <span class="text-xs flex items-center gap-1.5 font-medium" style="color: #b45309;">
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 7h12M9 3l4 4-4 4"/>
                          </svg>
                          {depLoc.name}
                          <span style="color: var(--clr-border, #c4c1bb);">→</span>
                          {location.name}
                        </span>
                      {:else if preview}
                        <span class="text-xs truncate" style="color: var(--clr-subtle, #57564f);">{preview}</span>
                      {:else}
                        <span class="text-xs italic" style="color: var(--clr-border, #c4c1bb);">Nog niets gepland</span>
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
                      class="group flex items-center justify-between gap-4 px-4 py-2.5 text-left w-full transition-colors rounded-r-xl"
                      style="background-color: rgba(245,158,11,0.05);"
                      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,158,11,0.10)'; }}
                      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,158,11,0.05)'; }}
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="text-xs flex-shrink-0 tabular-nums" style="color: var(--clr-muted, #8b8a84); min-width: 80px;">
                          {formatDayRow(sharedDay.date)}
                        </span>
                        <span class="text-xs flex items-center gap-1.5 font-medium" style="color: #b45309;">
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 7h12M9 3l4 4-4 4"/>
                          </svg>
                          {location.name}
                          <span style="color: var(--clr-border, #c4c1bb);">→</span>
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
            <DateRangePicker bind:startDate={newCityStart} bind:endDate={newCityEnd} />
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
    <div class="sticky space-y-4" style="top: 72px;">
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
