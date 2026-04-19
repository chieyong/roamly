<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import type { Activity } from '$lib/types';

  /**
   * An absolute-positioned overlay that covers an entire city section.
   * Accepts 'city-idea' drag items from MaybeList.
   * When dropped: inserts the new city BEFORE `beforeLocationId`.
   */
  let {
    beforeLocationId,
    cityName,
    onInsert,
  }: {
    beforeLocationId: string;
    cityName: string;
    onInsert: (activity: Activity, beforeLocationId: string) => void;
  } = $props();

  let zoneItems = $state<Activity[]>([]);
  let isHover   = $state(false);

  function handleConsider(e: CustomEvent) {
    zoneItems = e.detail.items;
    isHover   = zoneItems.length > 0;
  }

  function handleFinalize(e: CustomEvent) {
    zoneItems = e.detail.items;
    isHover   = false;
    if (zoneItems.length > 0) {
      onInsert(zoneItems[0], beforeLocationId);
      zoneItems = [];
    }
  }
</script>

<!--
  Covers the parent city section (parent must have position: relative).
  Shows a subtle dashed ring at rest; lights up teal on hover.
-->
<div
  use:dndzone={{ items: zoneItems, type: 'city-idea', dropTargetStyle: {}, flipDurationMs: 0 }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
  role="list"
  aria-label="Stad invoegen vóór {cityName}"
  style="
    position: absolute; inset: -2px; z-index: 20;
    border-radius: 14px;
    background-color: {isHover ? 'rgba(20,184,166,0.10)' : 'transparent'};
    border: 2px dashed {isHover ? '#14b8a6' : 'rgba(20,184,166,0.28)'};
    display: flex; align-items: center; justify-content: center;
    transition: background-color 0.12s, border-color 0.12s;
    pointer-events: auto;
  "
>
  <!-- Items are hidden inline; the DnD ghost is shown by svelte-dnd-action -->
  {#each zoneItems as item (item.id)}
    <div style="display: none;" aria-hidden="true">{item.title}</div>
  {/each}

  {#if isHover}
    <div
      class="pointer-events-none text-xs font-semibold px-3 py-1.5 rounded-lg"
      style="background: white; color: #0d9488; border: 1px solid #99f6e4; box-shadow: 0 2px 10px rgba(0,0,0,0.12);"
    >
      ↕ Invoegen vóór {cityName}
    </div>
  {/if}
</div>
