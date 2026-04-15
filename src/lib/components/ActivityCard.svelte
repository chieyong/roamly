<script lang="ts">
  import type { Activity } from '$lib/types';
  import { updateActivity, deleteActivity } from '$lib/stores/trip';
  import { mapFocusLocation, expandedActivityId, editingActivityId } from '$lib/stores/ui';
  import AIChatDrawer from './AIChatDrawer.svelte';

  let {
    activity,
    isDragging = false,
  }: {
    activity: Activity;
    isDragging?: boolean;
  } = $props();

  // ── Accordion ─────────────────────────────────────────────────────────────
  const expanded = $derived($expandedActivityId === activity.id);
  const editing  = $derived($editingActivityId  === activity.id);

  // AI chat open for THIS card
  let chatOpen = $state(false);

  // The single subline: prefer location, fall back to a trimmed note
  const subline = $derived(() => {
    if (activity.location) return activity.location;
    if (activity.notes) return activity.notes.split('\n')[0].slice(0, 60);
    return null;
  });

  // ── Edit form state ───────────────────────────────────────────────────────
  let editTitle    = $state('');
  let editNotes    = $state('');
  let editTime     = $state('');
  let editLocation = $state('');

  // ── Contextual image ──────────────────────────────────────────────────────
  function getImageSeed(title: string, location: string | undefined): string {
    const t = (title + ' ' + (location ?? '')).toLowerCase();
    if (/temple|shrine|torii|senso|meiji|fushimi/.test(t))       return 'japan-temple-42';
    if (/garden|park|bamboo|forest|nature/.test(t))               return 'japan-garden-17';
    if (/ramen|soba|udon|noodle/.test(t))                         return 'japan-ramen-88';
    if (/sushi|sashimi|seafood/.test(t))                          return 'japan-sushi-55';
    if (/coffee|café|cafe|matcha/.test(t))                        return 'japan-cafe-31';
    if (/market|tsukiji|food|eat|dinner|lunch|breakfast/.test(t)) return 'japan-food-63';
    if (/onsen|hot spring|bath|spa/.test(t))                      return 'japan-onsen-74';
    if (/shopping|store|mall|fashion|vintage/.test(t))            return 'japan-shopping-22';
    if (/museum|gallery|art|exhibition/.test(t))                  return 'japan-museum-49';
    if (/hike|mountain|fuji|climb/.test(t))                       return 'japan-mountain-91';
    if (/bar|drinks|beer|cocktail|sake|izakaya/.test(t))          return 'japan-bar-38';
    if (/hotel|hostel|airbnb|check.?in/.test(t))                  return 'japan-hotel-66';
    if (/observation|tower|sky|view|rooftop/.test(t))             return 'japan-skyline-80';
    if (/walk|wander|stroll|street|explore/.test(t))              return 'japan-street-14';
    if (/shibuya/.test(t))    return 'shibuya-crossing-7';
    if (/shinjuku/.test(t))   return 'shinjuku-night-3';
    if (/asakusa/.test(t))    return 'asakusa-temple-9';
    if (/harajuku/.test(t))   return 'harajuku-street-5';
    if (/ginza/.test(t))      return 'ginza-street-11';
    if (/nakameguro/.test(t)) return 'nakameguro-canal-2';
    return 'japan-travel-' + ((title.charCodeAt(0) ?? 50) % 30 + 1);
  }

  const imageUrl = $derived(
    `https://picsum.photos/seed/${getImageSeed(activity.title, activity.location)}/600/200`
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  function focusEl(el: HTMLElement) { el.focus(); }

  function startEditing() {
    editTitle    = activity.title;
    editNotes    = activity.notes ?? '';
    editTime     = activity.time ?? '';
    editLocation = activity.location ?? '';
    chatOpen = false;
    expandedActivityId.set(null);
    editingActivityId.set(activity.id);
  }

  function save() {
    updateActivity({
      ...activity,
      title:    editTitle.trim() || activity.title,
      notes:    editNotes.trim()    || undefined,
      time:     editTime.trim()     || undefined,
      location: editLocation.trim() || undefined,
    });
    editingActivityId.set(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') { editingActivityId.set(null); }
  }

  function handleDelete() {
    if (confirm(`"${activity.title}" verwijderen?`)) deleteActivity(activity.id);
  }

  function toggleExpand() {
    if (isDragging) return;
    editingActivityId.set(null);
    const opening = $expandedActivityId !== activity.id;
    if (!opening) chatOpen = false; // reset chat when closing card
    expandedActivityId.update((id) => (id === activity.id ? null : activity.id));
    if (activity.location) mapFocusLocation.set(activity.location);
  }

  function openChat(e: MouseEvent) {
    e.stopPropagation();
    chatOpen = true;
  }
</script>

<div
  class="relative transition-all duration-200 {isDragging ? 'opacity-40 scale-[0.98]' : ''}"
  role="listitem"
>
  {#if editing}
    <!-- ── Edit form ──────────────────────────────────────────────────────── -->
    <div
      class="rounded-2xl p-4 space-y-2.5"
      style="background-color: white; border: 1px solid #d4d1c8; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
    >
      <input
        bind:value={editTitle}
        onkeydown={handleKeydown}
        use:focusEl
        placeholder="Naam activiteit"
        class="w-full text-sm font-medium rounded-xl px-3 py-2.5 border focus:outline-none transition-colors"
        style="background-color: #fafaf8; border-color: #e8e6e0; color: #1a1917;"
      />
      <div class="flex gap-2">
        <input
          bind:value={editTime}
          onkeydown={handleKeydown}
          placeholder="9:00 AM"
          class="w-28 text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
          style="background-color: #fafaf8; border-color: #e8e6e0; color: #2a2926;"
        />
        <input
          bind:value={editLocation}
          onkeydown={handleKeydown}
          placeholder="Locatie of buurt"
          class="flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
          style="background-color: #fafaf8; border-color: #e8e6e0; color: #2a2926;"
        />
      </div>
      <textarea
        bind:value={editNotes}
        onkeydown={handleKeydown}
        rows={2}
        placeholder="Notities…"
        class="w-full text-xs rounded-xl px-3 py-2 border focus:outline-none resize-none transition-colors"
        style="background-color: #fafaf8; border-color: #e8e6e0; color: #57564f;"
      ></textarea>
      <div class="flex gap-2 justify-end pt-0.5">
        <button
          onclick={() => editingActivityId.set(null)}
          class="text-xs px-3 py-1.5 rounded-xl transition-colors"
          style="color: #8b8a84;"
        >Annuleren</button>
        <button
          onclick={save}
          class="text-xs px-4 py-1.5 rounded-xl font-medium transition-colors"
          style="background-color: #14b8a6; color: white;"
        >Opslaan</button>
      </div>
    </div>

  {:else}
    <!-- ── Collapsed card ─────────────────────────────────────────────────── -->
    <button
      onclick={toggleExpand}
      class="w-full text-left rounded-2xl px-4 py-3 transition-all duration-150 cursor-pointer"
      style="background-color: white;
             border: 1px solid {expanded ? '#c4f1ea' : '#ece9e4'};
             {expanded ? 'border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-color: transparent;' : ''}"
    >
      <div class="flex items-baseline justify-between gap-3">
        <span class="text-sm font-medium leading-snug flex-1 min-w-0 truncate" style="color: #1a1917;">
          {activity.title}
        </span>
        {#if activity.time}
          <span class="text-xs font-medium flex-shrink-0 tabular-nums" style="color: #0d9488;">
            {activity.time}
          </span>
        {/if}
      </div>
      {#if subline()}
        <p class="text-xs mt-0.5 truncate" style="color: #a09e98;">{subline()}</p>
      {/if}
    </button>

    <!-- ── Expanded drawer ────────────────────────────────────────────────── -->
    {#if expanded}
      {#if chatOpen}
        <!-- ── AI Chat ──────────────────────────────────────────────────── -->
        <AIChatDrawer {activity} onClose={() => { chatOpen = false; }} />
      {:else}
        <!-- ── Detail view ───────────────────────────────────────────────── -->
        <div
          class="rounded-b-2xl px-4 py-3"
          style="background-color: white; border: 1px solid #c4f1ea; border-top: none;"
        >
          <!-- Image + details row -->
          <div class="flex gap-3 mb-3">
            <div style="flex-shrink: 0; width: 64px; height: 64px; border-radius: 10px; overflow: hidden;">
              <img
                src={imageUrl}
                alt={activity.title}
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                loading="lazy"
              />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center gap-1">
              {#if activity.notes}
                <p class="text-xs leading-relaxed line-clamp-3" style="color: #57564f;">{activity.notes}</p>
              {:else}
                <p class="text-xs italic" style="color: #b0ada7;">Nog geen omschrijving.</p>
              {/if}
              {#if activity.duration}
                <span class="text-xs" style="color: #a09e98;">⏱ {activity.duration}</span>
              {/if}
            </div>
          </div>

          <!-- Action row -->
          <div class="flex items-center gap-1">
            <button
              onclick={openChat}
              class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors font-medium"
              style="background-color: #f0fdfa; color: #0d9488;"
            >
              <span>✦</span> Vraag AI
            </button>
            <button
              onclick={(e) => { e.stopPropagation(); startEditing(); }}
              class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
              style="color: #8b8a84;"
            >
              Bewerken
            </button>
            <button
              onclick={(e) => { e.stopPropagation(); handleDelete(); }}
              class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors ml-auto"
              style="color: #c4b8b8;"
            >
              Verwijderen
            </button>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>
