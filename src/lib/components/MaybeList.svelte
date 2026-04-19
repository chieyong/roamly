<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Activity } from '$lib/types';
  import { maybeList, addActivity, deleteActivity, updateActivity, generateId, locations, daysByLocation, activities } from '$lib/stores/trip';
  import { draggingCityIdea } from '$lib/stores/ui';

  // When filterLocationId is provided (day page): show items for that city + untagged.
  // When omitted (main page): show ONLY untagged items (city-level ideas with no locationId).
  let { filterLocationId = undefined }: { filterLocationId?: string } = $props();

  const filteredMaybe = $derived(
    filterLocationId !== undefined
      // Day page: show only activity ideas tagged to this specific city
      ? $maybeList.filter(a => a.locationId === filterLocationId)
      // Main page: show only city-level ideas (no locationId = not pinned to a specific city)
      : $maybeList.filter(a => !a.locationId)
  );

  // Suppress $effect re-sync during active drag (prevents visual glitches)
  let dragging = $state(false);
  let items    = $state<Activity[]>([]);

  // Handle-only drag: prevent accidental drag while scrolling on mobile.
  // Drag only starts when the 6-dot handle receives a pointerdown.
  let listDragEnabled = $state(false);

  function onHandlePointerDown() {
    listDragEnabled = true;
    // Only reset if drag never actually started; if dragging is true, handleFinalize resets.
    window.addEventListener('pointerup', () => {
      if (!dragging) listDragEnabled = false;
    }, { once: true });
  }

  $effect(() => {
    if (!dragging) {
      items = filteredMaybe.map(a => ({ ...a }));
    }
  });

  let adding = $state(false);
  let newTitle = $state('');
  let newNotes = $state('');
  let newTagLocationId = $state('');

  function confirmAdd() {
    if (!newTitle.trim()) { adding = false; return; }
    addActivity({
      id: generateId(),
      dayId: 'maybe',
      section: 'maybe',
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      order: $maybeList.length,
      // On day page, tag to current city. On main page, no locationId (city-level idea).
      locationId: filterLocationId ?? (newTagLocationId || undefined),
    });
    newTitle = '';
    newNotes = '';
    newTagLocationId = '';
    adding = false;
  }

  function focusEl(el: HTMLElement) { el.focus(); }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') confirmAdd();
    if (e.key === 'Escape') { adding = false; }
  }

  function handleConsider(e: CustomEvent) {
    dragging = true;
    if (isMainPage) draggingCityIdea.set(true);
    items = e.detail.items;
  }

  function handleFinalize(e: CustomEvent) {
    const newItems: Activity[] = e.detail.items;
    const newIds = new Set(newItems.map((i: Activity) => i.id));

    // If an item left this container (dragged to another dndzone), delete it from store.
    // The receiving container is responsible for creating whatever it needs from the item.
    for (const prev of items) {
      if (!newIds.has(prev.id)) {
        deleteActivity(prev.id);
      }
    }

    dragging = false;
    listDragEnabled = false;
    if (isMainPage) draggingCityIdea.set(false);
    items = newItems;
  }

  function locationName(locId: string): string {
    return $locations.find(l => l.id === locId)?.name ?? '';
  }

  const isMainPage = $derived(filterLocationId === undefined);

  // DnD type: on main page use 'city-idea' so items can be dragged to the planning zone.
  // On day page use default (compatible with DaySection drop zones).
  const dndType = $derived(isMainPage ? 'city-idea' : undefined);

  // Label for the empty state
  const emptyLabel = $derived(
    isMainPage
      ? 'Geen bestemmingsideeën. Voeg steden toe die je wilt bezoeken!'
      : 'Geen ideeën voor deze bestemming'
  );
</script>

<aside
  class="rounded-3xl p-5 space-y-4"
  style="background-color: white; border: 1px solid #e8e6e0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);"
>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold" style="color: #2a2926;">
      {isMainPage ? 'Maybe List' : 'Ideeën voor deze stad'}
    </h2>
    <button
      onclick={() => { adding = !adding; }}
      class="text-xs flex items-center gap-1 px-2 py-1 rounded-xl transition-colors"
      style="color: #8b8a84;"
      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdfa'; }}
      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 3v10M3 8h10"/>
      </svg>
      {isMainPage ? 'Stad toevoegen' : 'Idee toevoegen'}
    </button>
  </div>

  <p class="text-xs leading-relaxed" style="color: #8b8a84;">
    {isMainPage
      ? 'Steden die je overweegt te bezoeken. Sleep naar de planning om ze in te plannen.'
      : 'Ideeën voor deze bestemming. Sleep naar een dagdeel als je ze inplant.'}
  </p>

  <!-- Add form -->
  {#if adding}
    <div class="space-y-2 p-3 rounded-2xl" style="background-color: #fafaf8; border: 1px solid #e8e6e0;">
      <input
        bind:value={newTitle}
        onkeydown={handleKeydown}
        use:focusEl
        placeholder={isMainPage ? 'Stad of bestemming…' : 'Naam van het idee…'}
        class="w-full text-sm rounded-xl px-3 py-2 border focus:outline-none"
        style="background-color: white; border-color: #e8e6e0; color: #1a1917;"
      />
      <textarea
        bind:value={newNotes}
        onkeydown={handleKeydown}
        rows={2}
        placeholder="Notities (optioneel)…"
        class="w-full text-xs rounded-xl px-3 py-2 border focus:outline-none resize-none"
        style="background-color: white; border-color: #e8e6e0; color: #1a1917;"
      ></textarea>
      <!-- City selector: only on day page (to tag to a specific city) -->
      {#if !isMainPage && $locations.length > 0}
        <select
          bind:value={newTagLocationId}
          class="w-full text-xs rounded-xl px-3 py-2 border focus:outline-none"
          style="background-color: white; border-color: #e8e6e0; color: #57564f;"
        >
          <option value="">Geen specifieke stad</option>
          {#each $locations as loc}
            <option value={loc.id}>{loc.name}</option>
          {/each}
        </select>
      {/if}
      <div class="flex gap-2 justify-end">
        <button
          onclick={() => { adding = false; }}
          class="text-xs px-3 py-1.5 rounded-xl transition-colors"
          style="color: #8b8a84;"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >Annuleer</button>
        <button
          onclick={confirmAdd}
          class="text-xs px-4 py-1.5 rounded-xl font-medium"
          style="background-color: #14b8a6; color: white;"
        >Toevoegen</button>
      </div>
    </div>
  {/if}

  <!-- Drag-and-drop list -->
  <div
    use:dndzone={{ items, type: dndType, dropTargetStyle: {}, flipDurationMs: 200, dragDisabled: !listDragEnabled }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
    class="space-y-2 min-h-[48px]"
    role="list"
  >
    {#each items as item (item.id)}
      <div animate:flip={{ duration: 200 }}>
        <div
          class="group flex items-start gap-3 p-3 rounded-2xl transition-all cursor-grab active:cursor-grabbing"
          style="background-color: #fafaf8; border: 1px solid #e8e6e0;"
        >
          <!-- Drag handle: always visible on mobile, hover-only on desktop -->
          <div
            onpointerdown={onHandlePointerDown}
            class="flex-shrink-0 mt-0.5 opacity-35 lg:opacity-0 lg:group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing"
            style="touch-action: none;"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #8b8a84;">
              <circle cx="5" cy="4" r="1" fill="currentColor" stroke="none"/>
              <circle cx="5" cy="8" r="1" fill="currentColor" stroke="none"/>
              <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/>
              <circle cx="11" cy="4" r="1" fill="currentColor" stroke="none"/>
              <circle cx="11" cy="8" r="1" fill="currentColor" stroke="none"/>
              <circle cx="11" cy="12" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium leading-snug" style="color: #57564f;">{item.title}</p>
            {#if item.notes}
              <p class="text-xs mt-0.5 line-clamp-2" style="color: #8b8a84;">{item.notes}</p>
            {/if}
            <!-- Show city badge on main page when item is city-tagged -->
            {#if item.locationId && isMainPage}
              <span
                class="text-xs mt-1.5 inline-block px-1.5 py-0.5 rounded-md"
                style="background: #f0fdfa; color: #0d9488;"
              >
                {locationName(item.locationId)}
              </span>
            {/if}
            <!-- Show neighborhood on day page when item has a location string -->
            {#if !isMainPage && item.location}
              <span
                class="text-xs mt-1.5 inline-block px-1.5 py-0.5 rounded-md"
                style="background: #fafaf8; color: #8b8a84; border: 1px solid #e8e6e0;"
              >
                {item.location}
              </span>
            {/if}
          </div>
          <button
            onclick={() => deleteActivity(item.id)}
            aria-label="Verwijder idee"
            class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
            style="color: #d4d1c8;"
          >
            <svg class="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </button>
        </div>
      </div>
    {/each}

    {#if items.length === 0 && !adding}
      <div class="flex flex-col items-center justify-center gap-1 py-5 rounded-2xl" style="border: 2px dashed #e8e6e0;">
        {#if isMainPage}
          <svg class="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #d4d1c8;">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        {/if}
        <p class="text-xs text-center px-4" style="color: #b0ada7;">{emptyLabel}</p>
      </div>
    {/if}
  </div>
</aside>
