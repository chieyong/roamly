<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Activity } from '$lib/types';
  import { maybeList, addActivity, deleteActivity, generateId } from '$lib/stores/trip';

  let items = $state<Activity[]>([]);
  $effect(() => {
    items = $maybeList.map((a) => ({ ...a }));
  });

  let adding = $state(false);
  let newTitle = $state('');
  let newNotes = $state('');

  function confirmAdd() {
    if (!newTitle.trim()) { adding = false; return; }
    addActivity({
      id: generateId(),
      dayId: 'maybe',
      section: 'maybe',
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      order: items.length,
      emoji: '💭'
    });
    newTitle = '';
    newNotes = '';
    adding = false;
  }

  function focusEl(el: HTMLElement) { el.focus(); }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') confirmAdd();
    if (e.key === 'Escape') { adding = false; }
  }

  function handleConsider(e: CustomEvent) { items = e.detail.items; }
  function handleFinalize(e: CustomEvent) { items = e.detail.items; }
</script>

<aside
  class="rounded-3xl p-5 space-y-4"
  style="background-color: white; border: 1px solid #e8e6e0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);"
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xl">💭</span>
      <h2 class="text-sm font-semibold" style="color: #2a2926;">Maybe List</h2>
    </div>
    <button
      onclick={() => { adding = !adding; }}
      class="text-xs flex items-center gap-1 px-2 py-1 rounded-xl transition-colors hover:bg-teal-50"
      style="color: #8b8a84;"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 3v10M3 8h10"/>
      </svg>
      Add idea
    </button>
  </div>

  <p class="text-xs leading-relaxed" style="color: #8b8a84;">
    Ideas you haven't committed to yet. Drag them into a day when ready.
  </p>

  {#if adding}
    <div class="space-y-2 p-3 rounded-2xl" style="background-color: #fafaf8; border: 1px solid #e8e6e0;">
      <input
        bind:value={newTitle}
        onkeydown={handleKeydown}
        use:focusEl
        placeholder="Idea name…"
        class="w-full text-sm rounded-xl px-3 py-2 border focus:outline-none"
        style="background-color: white; border-color: #e8e6e0;"
      />
      <textarea
        bind:value={newNotes}
        onkeydown={handleKeydown}
        rows={2}
        placeholder="Notes (optional)…"
        class="w-full text-xs rounded-xl px-3 py-2 border focus:outline-none resize-none"
        style="background-color: white; border-color: #e8e6e0;"
      ></textarea>
      <div class="flex gap-2 justify-end">
        <button
          onclick={() => { adding = false; }}
          class="text-xs px-3 py-1.5 rounded-xl transition-colors hover:bg-gray-100"
          style="color: #8b8a84;"
        >Cancel</button>
        <button
          onclick={confirmAdd}
          class="text-xs px-4 py-1.5 rounded-xl font-medium"
          style="background-color: #14b8a6; color: white;"
        >Add</button>
      </div>
    </div>
  {/if}

  <div
    use:dndzone={{ items, dropTargetStyle: {}, flipDurationMs: 200 }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
    class="space-y-2 min-h-[48px]"
    role="list"
  >
    {#each items as item (item.id)}
      <div animate:flip={{ duration: 200 }}>
        <div class="group flex items-start gap-3 p-3 rounded-2xl transition-all cursor-grab active:cursor-grabbing"
          style="background-color: #fafaf8; border: 1px solid #e8e6e0;"
        >
          <span class="text-lg leading-none flex-shrink-0 mt-0.5">{item.emoji ?? '💭'}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium leading-snug" style="color: #57564f;">{item.title}</p>
            {#if item.notes}
              <p class="text-xs mt-0.5 line-clamp-2" style="color: #8b8a84;">{item.notes}</p>
            {/if}
          </div>
          <button
            onclick={() => deleteActivity(item.id)}
            aria-label="Remove idea"
            class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center transition-all"
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
      <div class="flex items-center justify-center h-16 rounded-2xl" style="border: 2px dashed #e8e6e0;">
        <p class="text-xs" style="color: #8b8a84;">No ideas yet</p>
      </div>
    {/if}
  </div>
</aside>
