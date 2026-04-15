<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Activity, ActivityEnrichment, Section } from '$lib/types';
  import ActivityCard from './ActivityCard.svelte';
  import { addActivity, updateActivity, generateId, reorderSection } from '$lib/stores/trip';
  import { calcNextTime } from '$lib/utils/time';
  import { enrichActivity } from '$lib/ai/suggestions';

  let {
    dayId,
    section,
    sectionActivities
  }: {
    dayId: string;
    section: Section;
    sectionActivities: Activity[];
  } = $props();

  const meta: Record<Section, { label: string; emoji: string }> = {
    morning:   { label: 'morning',   emoji: '🌅' },
    afternoon: { label: 'afternoon', emoji: '☀️' },
    evening:   { label: 'evening',   emoji: '🌙' },
    maybe:     { label: 'maybe',     emoji: '💭' },
  };

  const { label, emoji } = $derived(meta[section]);
  const isEmpty = $derived(sectionActivities.length === 0);

  // DnD local copy
  let items = $state<Activity[]>([]);
  $effect(() => { items = sectionActivities.map((a) => ({ ...a })); });

  // ── Add-activity state machine ───────────────────────────────────────────
  // idle → typing → enriching → preview → idle
  type AddState = 'idle' | 'typing' | 'enriching' | 'preview';
  let addState   = $state<AddState>('idle');
  let newTitle   = $state('');
  let enrichment = $state<ActivityEnrichment | null>(null);

  function focusEl(el: HTMLElement) { el.focus(); }

  function startAdding() {
    newTitle  = '';
    addState  = 'typing';
    enrichment = null;
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) { resetAdd(); return; }

    addState = 'enriching';
    enrichment = await enrichActivity(title, section);
    addState = 'preview';
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') resetAdd();
  }

  /** Confirm: create activity using AI-enriched data */
  function confirmWithEnrichment() {
    if (!enrichment) return;
    addActivity({
      id:       generateId(),
      dayId,
      section,
      title:    newTitle.trim(),
      order:    items.length,
      emoji:    enrichment.emoji,
      time:     enrichment.time    ?? calcNextTime(items.at(-1), section),
      duration: enrichment.duration ?? undefined,
      location: enrichment.location ?? undefined,
      notes:    enrichment.notes    ?? undefined,
    });
    resetAdd();
  }

  /** Skip: create activity without enrichment (original behaviour) */
  function addPlain() {
    const title = newTitle.trim();
    if (!title) { resetAdd(); return; }
    addActivity({
      id:    generateId(),
      dayId,
      section,
      title,
      order: items.length,
      time:  calcNextTime(items.at(-1), section),
    });
    resetAdd();
  }

  function resetAdd() {
    newTitle   = '';
    addState   = 'idle';
    enrichment = null;
  }

  // ── Drag & drop ─────────────────────────────────────────────────────────
  let draggedId    = $state<string | null>(null);
  let isDropTarget = $state(false);

  function handleDndConsider(e: CustomEvent) {
    items        = e.detail.items;
    draggedId    = e.detail.info?.id ?? null;
    isDropTarget = true;
  }

  function handleDndFinalize(e: CustomEvent) {
    const newItems: Activity[]         = e.detail.items;
    const droppedId: string | undefined = e.detail.info?.id;

    draggedId    = null;
    isDropTarget = false;

    const droppedIndex = droppedId
      ? newItems.findIndex((i) => i.id === droppedId)
      : -1;

    let finalItems: Activity[] = newItems.map((item, idx) => ({
      ...item, dayId, section, order: idx,
    }));

    if (droppedIndex !== -1) {
      for (let i = droppedIndex; i < finalItems.length; i++) {
        const prev = i > 0 ? finalItems[i - 1] : undefined;
        finalItems[i] = { ...finalItems[i], time: calcNextTime(prev, section) };
      }
    }

    items = finalItems;
    finalItems.forEach((item) => updateActivity(item));
    reorderSection(dayId, section, finalItems.map((i) => i.id));
  }
</script>

<div class="space-y-0">
  <!-- Section label row -->
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-1.5">
      <span class="text-xs tracking-wide" style="color: #b0ada7; font-weight: 500; letter-spacing: 0.04em;">{label}</span>
    </div>

    <button
      onclick={startAdding}
      aria-label="Add activity"
      class="flex items-center gap-1 text-xs rounded-xl px-2 py-1 transition-colors"
      style="color: #c4bfb9;"
    >
      <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2v8M2 6h8"/>
      </svg>
      <span style="font-size: 11px;">add</span>
    </button>
  </div>

  <!-- Activity list / drop zone -->
  <div
    use:dndzone={{ items, dropTargetStyle: {}, flipDurationMs: 180 }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    class="space-y-1.5 rounded-2xl transition-all duration-200"
    style="{isDropTarget && isEmpty
      ? 'min-height: 56px; background-color: #f0fdfa; border: 1.5px dashed #99f6e4; padding: 6px;'
      : 'min-height: 0;'}"
    role="list"
  >
    {#each items as item (item.id)}
      <div animate:flip={{ duration: 180 }} class="relative" data-location={item.location ?? ''}>
        <ActivityCard
          activity={item}
          isDragging={draggedId === item.id}
        />
      </div>
    {/each}

    {#if isEmpty && !isDropTarget && addState === 'idle'}
      <button
        onclick={startAdding}
        class="w-full text-left px-4 py-2.5 rounded-xl text-xs transition-colors"
        style="color: #c4bfb9;"
      >
        Nog niets gepland — <span style="color: #14b8a6;">voeg iets toe</span>
      </button>
    {/if}
  </div>

  <!-- ── Inline add UI ──────────────────────────────────────────────────── -->

  {#if addState === 'typing'}
    <!-- Step 1: title input -->
    <div class="flex gap-2 mt-2">
      <input
        bind:value={newTitle}
        onkeydown={handleAddKeydown}
        use:focusEl
        placeholder="Wat staat er {label} op het programma?"
        class="flex-1 text-sm rounded-xl px-3 py-2.5 border focus:outline-none transition-colors"
        style="background-color: white; border-color: #d4d1c8; color: #1a1917;"
      />
      <button
        onclick={handleAdd}
        class="px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
        style="background-color: #14b8a6; color: white;"
      >Add</button>
      <button
        onclick={resetAdd}
        class="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors flex-shrink-0"
        style="color: #b0ada7; background-color: #f4f3ef;"
        aria-label="Cancel"
      >✕</button>
    </div>

  {:else if addState === 'enriching'}
    <!-- Step 2: thinking shimmer -->
    <div
      class="mt-2 rounded-2xl px-4 py-3 flex items-center gap-3"
      style="background-color: white; border: 1px solid #e8e6e0;"
    >
      <div
        class="w-4 h-4 rounded-full flex-shrink-0 animate-spin"
        style="border: 2px solid #e8e6e0; border-top-color: #14b8a6;"
      ></div>
      <span class="text-xs" style="color: #b0ada7;">
        <span style="color: #14b8a6; font-size: 10px; margin-right: 4px;">✦</span>
        Filling in details for <span style="color: #2a2926; font-style: italic;">"{newTitle}"</span>…
      </span>
    </div>

  {:else if addState === 'preview' && enrichment}
    <!-- Step 3: preview enriched card -->
    <div
      class="mt-2 rounded-2xl overflow-hidden"
      style="background-color: white; border: 1.5px solid #c4f1ea; box-shadow: 0 2px 12px rgba(20,184,166,0.08);"
    >
      <!-- Header: AI badge -->
      <div
        class="flex items-center gap-1.5 px-4 pt-3 pb-2"
        style="border-bottom: 1px solid #f0fdfa;"
      >
        <span style="color: #14b8a6; font-size: 10px;">✦</span>
        <span class="text-xs font-medium" style="color: #0d9488;">AI suggested details</span>
      </div>

      <!-- Activity preview -->
      <div class="px-4 py-3 space-y-3">
        <!-- Title row with emoji -->
        <div class="flex items-center gap-2.5">
          <span class="text-xl leading-none">{enrichment.emoji}</span>
          <span class="text-sm font-medium" style="color: #1a1917;">{newTitle}</span>
        </div>

        <!-- Detail chips -->
        <div class="flex flex-wrap gap-1.5">
          {#if enrichment.location}
            <span
              class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style="background-color: #f0fdfa; color: #0d9488; border: 1px solid #a7f3d0;"
            >
              <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="6" cy="5" r="2"/>
                <path d="M6 2C4.3 2 3 3.3 3 5c0 2.5 3 5 3 5s3-2.5 3-5c0-1.7-1.3-3-3-3z"/>
              </svg>
              {enrichment.location}
            </span>
          {/if}
          {#if enrichment.time}
            <span
              class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style="background-color: #f4f3ef; color: #57564f; border: 1px solid #e8e6e0;"
            >
              <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="6" cy="6" r="4.5"/>
                <path d="M6 3.5V6l1.5 1.5"/>
              </svg>
              {enrichment.time}
            </span>
          {/if}
          {#if enrichment.duration}
            <span
              class="text-xs px-2.5 py-1 rounded-full"
              style="background-color: #f4f3ef; color: #57564f; border: 1px solid #e8e6e0;"
            >
              {enrichment.duration}
            </span>
          {/if}
        </div>

        <!-- Notes (if any) -->
        {#if enrichment.notes}
          <p class="text-xs leading-relaxed" style="color: #8b8a84;">{enrichment.notes}</p>
        {/if}
      </div>

      <!-- Action row -->
      <div
        class="flex items-center gap-2 px-4 pb-3 pt-1"
        style="border-top: 1px solid #f4f3ef;"
      >
        <button
          onclick={confirmWithEnrichment}
          class="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-medium transition-colors"
          style="background-color: #14b8a6; color: white;"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 6l3 3 5-5"/>
          </svg>
          Confirm
        </button>
        <button
          onclick={addPlain}
          class="text-xs px-3 py-2 rounded-xl transition-colors"
          style="color: #b0ada7; background-color: #f4f3ef;"
        >
          Skip
        </button>
        <button
          onclick={resetAdd}
          class="ml-auto text-xs transition-colors"
          style="color: #c4bfb9;"
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>
