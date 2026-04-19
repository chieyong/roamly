<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import type { Activity } from '$lib/types';

  /**
   * beforeLocationId: the city that will come AFTER the inserted city.
   *   undefined = insert at the very end (after all cities).
   * onInsert: callback when a city idea is dropped here.
   */
  let {
    beforeLocationId = undefined,
    onInsert,
  }: {
    beforeLocationId?: string;
    onInsert: (activity: Activity, beforeLocationId: string | undefined) => void;
  } = $props();

  let zoneItems = $state<Activity[]>([]);
  let isHover = $state(false);

  function handleConsider(e: CustomEvent) {
    zoneItems = e.detail.items;
    isHover = zoneItems.length > 0;
  }

  function handleFinalize(e: CustomEvent) {
    zoneItems = e.detail.items;
    isHover = false;

    if (zoneItems.length > 0) {
      const item = zoneItems[0];
      onInsert(item, beforeLocationId);
      zoneItems = [];
    }
  }
</script>

<!-- Insertion zone: small horizontal slot that lights up when a city idea hovers over it -->
<div
  use:dndzone={{ items: zoneItems, type: 'city-idea', dropTargetStyle: {}, flipDurationMs: 150 }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
  role="list"
  class="transition-all duration-150 overflow-hidden rounded-xl"
  style="
    min-height: {isHover ? '48px' : '12px'};
    margin: {isHover ? '4px 0' : '2px 0'};
    border: {isHover ? '1.5px dashed #14b8a6' : '1.5px dashed transparent'};
    background-color: {isHover ? '#f0fdfa' : 'transparent'};
    display: flex; align-items: center; justify-content: center; padding: 0 12px;
  "
>
  {#each zoneItems as item (item.id)}
    <!-- Briefly visible during drop animation -->
    <div
      class="text-xs font-medium rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-none"
      style="background: #f0fdfa; color: #0d9488; border: 1px solid #a7f3d0;"
    >
      <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="6" cy="5" r="2"/>
        <path d="M6 2C4.3 2 3 3.3 3 5c0 2.5 3 5 3 5s3-2.5 3-5c0-1.7-1.3-3-3-3z"/>
      </svg>
      {item.title}
    </div>
  {/each}
  {#if zoneItems.length === 0 && isHover}
    <p class="text-xs pointer-events-none" style="color: #0d9488;">
      ✓ Loslaten om hier in te plannen
    </p>
  {/if}
</div>
