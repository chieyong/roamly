<script lang="ts">
  import type { Activity, AISuggestion } from '$lib/types';
  import { suggestActivities } from '$lib/ai/suggestions';
  import { addActivity, generateId } from '$lib/stores/trip';

  let {
    activity,
    onclose
  }: {
    activity: Activity;
    onclose?: () => void;
  } = $props();

  let loading = $state(false);
  let suggestions = $state<AISuggestion[]>([]);
  let addedTitles = $state(new Set<string>());
  let started = $state(false);

  async function load() {
    started = true;
    loading = true;
    suggestions = [];
    const loc = activity.location ?? activity.title ?? 'japan';
    suggestions = await suggestActivities(loc);
    loading = false;
  }

  // Kick off immediately when panel opens
  $effect(() => { load(); });

  function addSuggestion(s: AISuggestion) {
    addActivity({
      id: generateId(),
      dayId: activity.dayId,
      section: activity.section,
      title: s.title,
      notes: s.notes,
      emoji: s.emoji,
      duration: s.duration,
      order: 999,
    });
    addedTitles = new Set([...addedTitles, s.title]);
  }
</script>

<div
  class="bg-white rounded-2xl p-4 w-68 space-y-3"
  style="width: 260px; border: 1px solid #e8e6e0; box-shadow: 0 4px 16px rgba(0,0,0,0.08);"
  role="dialog"
  aria-label="AI suggestions"
>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-1.5">
      <span class="text-xs" style="color: #14b8a6;">✦</span>
      <span class="text-xs font-medium" style="color: #57564f;">
        Ideas near <span style="color: #2a2926;">{activity.location ?? activity.title}</span>
      </span>
    </div>
    <button
      onclick={onclose}
      aria-label="Close"
      class="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100 flex-shrink-0"
      style="color: #b0ada7;"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 3l10 10M13 3L3 13"/>
      </svg>
    </button>
  </div>

  <!-- Loading -->
  {#if loading}
    <div class="flex items-center gap-2 py-3">
      <div
        class="w-4 h-4 rounded-full animate-spin flex-shrink-0"
        style="border: 1.5px solid #e8e6e0; border-top-color: #14b8a6;"
      ></div>
      <span class="text-xs" style="color: #b0ada7;">Finding ideas…</span>
    </div>

  <!-- Suggestions -->
  {:else}
    <div class="space-y-1.5">
      {#each suggestions as s}
        {@const added = addedTitles.has(s.title)}
        <div
          class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
          style="background-color: #fafaf8;"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium leading-snug" style="color: #1a1917;">{s.title}</p>
            <p class="text-xs mt-0.5 leading-relaxed line-clamp-2" style="color: #a09e98;">{s.notes}</p>
            {#if s.duration}
              <p class="text-xs mt-1" style="color: #b0ada7;">{s.duration}</p>
            {/if}
          </div>
          <button
            onclick={() => addSuggestion(s)}
            disabled={added}
            aria-label="{added ? 'Added' : 'Add'}"
            class="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all mt-0.5"
            style="{added
              ? 'color: #14b8a6; background-color: #f0fdfa;'
              : 'color: #b0ada7; border: 1px solid #e8e6e0; background-color: white;'}"
          >
            {added ? '✓' : '+'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
