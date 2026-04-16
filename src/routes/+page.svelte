<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { trip, daysByLocation, activities, locations, addLocation, updateLocation, removeLocation } from '$lib/stores/trip';
  import type { Location } from '$lib/types';
  import MaybeList from '$lib/components/MaybeList.svelte';
  import TripOverviewMap from '$lib/components/TripOverviewMap.svelte';

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

  // Auto-advance end date on start change (reads directly from event to avoid bind timing)
  function onStartDateChange(e: Event) {
    const val = (e.currentTarget as HTMLInputElement).value;
    newCityStart = val;
    if (val && (!newCityEnd || newCityEnd <= val)) {
      const d = new Date(val + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      newCityEnd = localDateStr(d);
    }
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

  function onEditStartChange(e: Event) {
    const val = (e.currentTarget as HTMLInputElement).value;
    editStart = val;
    if (val && (!editEnd || editEnd <= val)) {
      const d = new Date(val + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      editEnd = localDateStr(d);
    }
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
</script>

<!-- ── Header ─────────────────────────────────────────────────────────────── -->
<div class="mb-10">
  <h1 class="text-2xl font-semibold" style="color: var(--clr-text, #1a1917); letter-spacing: -0.02em; font-family: var(--font-header);">
    {$trip.coverEmoji ?? '✈️'} {$trip.name}
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
  <div class="lg:col-span-2 space-y-8">
    {#each $daysByLocation as { location, days } (location.id)}
      {#if days.length > 0 || editingLocationId === location.id}
        <div>

          <!-- City header row -->
          <div class="flex items-center gap-2 mb-2 group">
            <div
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style="background-color: {cityColor(location.color)};"
            ></div>
            <span class="text-xs font-semibold" style="color: var(--clr-text, #1a1917);">
              {location.name}
            </span>
            <span class="text-xs" style="color: var(--clr-muted, #a09e98);">
              {formatDateShort(location.startDate)} – {formatDateShort(location.endDate)}
              · {days.length} {days.length === 1 ? 'dag' : 'dagen'}
            </span>

            <!-- Edit / delete buttons (appear on hover) -->
            <div class="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onclick={() => openEditCity(location)}
                class="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                style="color: {editingLocationId === location.id ? '#0d9488' : '#a09e98'};"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt, #f4f3ef)'; }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                title="Bewerk stad"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/>
                </svg>
              </button>
              <button
                onclick={() => askDeleteCity(location.id)}
                class="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                style="color: {deletingLocationId === location.id ? '#f43f5e' : '#a09e98'};"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--clr-surface-alt, #f4f3ef)'; }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                title="Verwijder stad"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 4h10M5 4V2h4v2M3 4l.7 8h6.6L11 4M5.5 6.5v3.5M8.5 6.5v3.5"/>
                </svg>
              </button>
            </div>
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
            <!-- ── Inline edit form ── -->
            <div
              class="rounded-2xl p-4 space-y-3 mb-2"
              style="border: 1.5px solid var(--clr-accent, #0d9488); background: var(--clr-accent-light, #f0fdfa);"
            >
              <!-- Naam -->
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

              <!-- Datums -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs block mb-1" style="color: var(--clr-muted, #8b8a84);">Aankomst</label>
                  <input
                    type="date"
                    value={editStart}
                    oninput={onEditStartChange}
                    onchange={onEditStartChange}
                    class="w-full text-xs rounded-xl px-3 py-2 outline-none"
                    style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
                  />
                </div>
                <div>
                  <label class="text-xs block mb-1" style="color: var(--clr-muted, #8b8a84);">Vertrek</label>
                  <input
                    type="date"
                    bind:value={editEnd}
                    class="w-full text-xs rounded-xl px-3 py-2 outline-none"
                    style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
                  />
                </div>
              </div>

              {#if editStart && editEnd && editStart < editEnd}
                <p class="text-xs" style="color: var(--clr-accent, #0d9488);">
                  {countDays(editStart, editEnd)} {countDays(editStart, editEnd) === 1 ? 'dag' : 'dagen'} gegenereerd
                </p>
              {:else if editStart && editEnd && editStart >= editEnd}
                <p class="text-xs" style="color: #f43f5e;">Vertrekdatum moet na aankomst liggen</p>
              {/if}

              <!-- Kleur -->
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

              <!-- Knoppen -->
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
              </div>
            </div>
          {:else}
            <!-- ── Day rows ── -->
            <div class="flex flex-col" style="border-left: 3px solid {cityColor(location.color)}; margin-left: 4px;">
              {#each days as day, i}
                {@const preview = topActivity(day.id)}
                {@const depLoc = day.departureLocationId ? $locations.find(l => l.id === day.departureLocationId) : null}
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
                      style="color: var(--clr-muted, #8b8a84); min-width: 80px;"
                    >
                      {formatDayRow(day.date)}
                    </span>

                    {#if depLoc}
                      <!-- Reisdag indicator -->
                      <span class="text-xs flex-shrink-0 flex items-center gap-1" style="color: var(--clr-muted, #a09e98);">
                        <span>🚄</span>
                        <span>van {depLoc.name}</span>
                      </span>
                    {:else if preview}
                      <span class="text-xs truncate" style="color: var(--clr-subtle, #57564f);">{preview}</span>
                    {:else}
                      <span class="text-xs italic" style="color: var(--clr-border, #c4c1bb);">Nog niets gepland</span>
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
                  <div style="height: 1px; margin-left: 16px; background-color: var(--clr-border-light, #f0eeea);"></div>
                {/if}
              {/each}
            </div>
          {/if}

        </div>
      {/if}
    {/each}

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

        <!-- Datums -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs block mb-1" style="color: var(--clr-muted, #8b8a84);">Aankomst</label>
            <input
              type="date"
              value={newCityStart}
              oninput={onStartDateChange}
              onchange={onStartDateChange}
              class="w-full text-xs rounded-xl px-3 py-2 outline-none"
              style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
            />
          </div>
          <div>
            <label class="text-xs block mb-1" style="color: var(--clr-muted, #8b8a84);">Vertrek</label>
            <input
              type="date"
              bind:value={newCityEnd}
              class="w-full text-xs rounded-xl px-3 py-2 outline-none"
              style="background-color: var(--clr-surface, white); border: 1.5px solid var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
            />
          </div>
        </div>

        {#if newCityStart && newCityEnd && newCityStart < newCityEnd}
          <p class="text-xs" style="color: var(--clr-accent, #0d9488);">
            {countDays(newCityStart, newCityEnd)} {countDays(newCityStart, newCityEnd) === 1 ? 'dag' : 'dagen'} gegenereerd
          </p>
        {:else if newCityStart && newCityEnd && newCityStart >= newCityEnd}
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
