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

  // ── Inline field editing (time / duration) ────────────────────────────────
  // Allows clicking the time or duration badge directly — without opening the full edit form.
  let inlineField = $state<'time' | 'duration' | null>(null);
  let inlineValue = $state('');

  function startInlineEdit(field: 'time' | 'duration', e: MouseEvent) {
    e.stopPropagation();
    // Close any full edit form open for this card
    if ($editingActivityId === activity.id) editingActivityId.set(null);
    inlineField = field;
    inlineValue = field === 'time' ? (activity.time ?? '') : (activity.duration ?? '');
  }

  function saveInlineEdit() {
    if (inlineField === 'time') {
      updateActivity({ ...activity, time: inlineValue.trim() || undefined });
    } else if (inlineField === 'duration') {
      updateActivity({ ...activity, duration: inlineValue.trim() || undefined });
    }
    inlineField = null;
  }

  function handleInlineKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(); }
    if (e.key === 'Escape') { inlineField = null; }
  }

  // ── Edit form state ───────────────────────────────────────────────────────
  let editTitle    = $state('');
  let editNotes    = $state('');
  let editTime     = $state('');
  let editLocation = $state('');
  let editDuration = $state('');

  // ── Contextual image via Unsplash keyword search ─────────────────────────
  function getImageQuery(title: string, loc: string | undefined): string {
    const t = (title + ' ' + (loc ?? '')).toLowerCase();
    // Named districts / cities first
    if (/shibuya/.test(t))      return 'shibuya crossing tokyo street crowd';
    if (/shinjuku/.test(t))     return 'shinjuku tokyo neon night';
    if (/asakusa/.test(t))      return 'asakusa senso-ji temple tokyo';
    if (/harajuku/.test(t))     return 'harajuku tokyo fashion street';
    if (/ginza/.test(t))        return 'ginza tokyo luxury shopping boulevard';
    if (/nakameguro/.test(t))   return 'nakameguro canal cherry blossom';
    if (/akihabara/.test(t))    return 'akihabara tokyo electronics anime';
    if (/ueno/.test(t))         return 'ueno park tokyo';
    if (/odaiba/.test(t))       return 'odaiba tokyo bay rainbow bridge';
    if (/arashiyama/.test(t))   return 'arashiyama bamboo forest kyoto';
    if (/fushimi/.test(t))      return 'fushimi inari torii gates kyoto';
    if (/gion/.test(t))         return 'gion geisha kyoto traditional street';
    if (/nara/.test(t))         return 'nara deer park japan';
    if (/dotonbori/.test(t))    return 'dotonbori osaka canal night lights';
    if (/osaka/.test(t))        return 'osaka japan cityscape';
    if (/kyoto/.test(t))        return 'kyoto japan temple traditional';
    if (/hiroshima/.test(t))    return 'hiroshima peace memorial japan';
    if (/hakone/.test(t))       return 'hakone fuji mountain japan';
    // Activity types
    if (/temple|shrine|torii/.test(t))              return 'japanese shinto shrine torii gate';
    if (/bamboo|forest/.test(t))                    return 'bamboo forest japan green path';
    if (/cherry|sakura|blossom/.test(t))            return 'sakura cherry blossom japan pink';
    if (/garden|park/.test(t))                      return 'japanese garden pond lantern';
    if (/ramen|soba|udon|noodle/.test(t))           return 'ramen bowl japan noodles';
    if (/sushi|sashimi|nigiri/.test(t))             return 'sushi platter japan fresh';
    if (/izakaya|bar|sake|beer/.test(t))            return 'japanese izakaya bar lanterns';
    if (/coffee|café|cafe|kissaten/.test(t))        return 'japanese coffee shop cozy';
    if (/matcha|tea/.test(t))                       return 'matcha tea ceremony japan';
    if (/food|eat|dinner|lunch|breakfast|market/.test(t)) return 'japanese street food market';
    if (/onsen|hot spring|bath|sento/.test(t))      return 'onsen hot spring japan steam';
    if (/shopping|mall|fashion|vintage/.test(t))    return 'japan shopping arcade street';
    if (/tsukiji|fish|seafood/.test(t))             return 'tsukiji fish market japan';
    if (/museum|gallery|art/.test(t))               return 'japanese art museum modern';
    if (/castle|shiro/.test(t))                     return 'japanese castle himeji';
    if (/fuji|mountain|hike|climb/.test(t))         return 'mount fuji japan sunrise';
    if (/hotel|check.?in|ryokan/.test(t))           return 'japanese ryokan hotel interior';
    if (/observation|tower|sky|rooftop|view/.test(t)) return 'tokyo tower skyline view';
    if (/walk|stroll|street|explore/.test(t))       return 'japan street walk explore';
    if (/train|shinkansen|subway|station/.test(t))  return 'shinkansen bullet train japan';
    // Default: use cleaned-up title
    return `${title} japan`.slice(0, 50);
  }

  const imageUrl = $derived(
    `https://source.unsplash.com/featured/128x128/?${encodeURIComponent(getImageQuery(activity.title, activity.location))}`
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  function focusEl(el: HTMLElement) { el.focus(); }

  function startEditing() {
    editTitle    = activity.title;
    editNotes    = activity.notes ?? '';
    editTime     = activity.time ?? '';
    editLocation = activity.location ?? '';
    editDuration = activity.duration ?? '';
    chatOpen = false;
    inlineField = null;
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
      duration: editDuration.trim() || undefined,
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
    if (inlineField) { inlineField = null; return; }
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
  class="group relative transition-all duration-200 {isDragging ? 'opacity-40 scale-[0.98]' : ''}"
  role="listitem"
>
  {#if editing}
    <!-- ── Edit form ──────────────────────────────────────────────────────── -->
    <div
      class="rounded-2xl p-4 space-y-2.5"
      style="background-color: var(--clr-surface, white); border: 1px solid var(--clr-border, #d4d1c8); box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
    >
      <input
        bind:value={editTitle}
        onkeydown={handleKeydown}
        use:focusEl
        placeholder="Naam activiteit"
        class="w-full text-sm font-medium rounded-xl px-3 py-2.5 border focus:outline-none transition-colors"
        style="background-color: var(--clr-bg, #fafaf8); border-color: var(--clr-border, #e8e6e0); color: var(--clr-text, #1a1917);"
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
          bind:value={editDuration}
          onkeydown={handleKeydown}
          placeholder="bijv. 1.5u"
          class="w-24 text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
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
    <!--
      Using div[role=button] instead of <button> so we can embed interactive
      time/duration inputs without violating the interactive-content-in-button rule.
    -->
    <div
      role="button"
      tabindex="0"
      onclick={toggleExpand}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); } }}
      class="w-full text-left rounded-2xl px-4 py-3 transition-all duration-150 cursor-pointer select-none"
      style="background-color: var(--clr-surface, white);
             border: 1px solid {expanded ? '#c4f1ea' : 'var(--clr-border, #ece9e4)'};
             {expanded ? 'border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-color: transparent;' : ''}"
    >
      <!-- Row 1: title + inline-editable time -->
      <div class="flex items-baseline justify-between gap-3">
        <span class="text-sm font-medium leading-snug flex-1 min-w-0 truncate" style="color: #1a1917;">
          {activity.title}
        </span>

        <!-- Inline time editor -->
        {#if inlineField === 'time'}
          <input
            bind:value={inlineValue}
            onblur={saveInlineEdit}
            onkeydown={handleInlineKeydown}
            use:focusEl
            onclick={(e) => e.stopPropagation()}
            placeholder="9:00 AM"
            class="text-xs font-medium tabular-nums w-22 text-center rounded-lg px-2 py-0.5 focus:outline-none flex-shrink-0"
            style="color: #0d9488; background: #f0fdfa; border: 1px solid #a7f3d0; min-width: 72px;"
          />
        {:else if activity.time}
          <span
            role="button"
            tabindex="0"
            class="text-xs font-medium flex-shrink-0 tabular-nums rounded-lg px-1.5 py-0.5 cursor-pointer transition-colors"
            style="color: #0d9488;"
            onclick={(e) => startInlineEdit('time', e)}
            onkeydown={(e) => { if (e.key === 'Enter') startInlineEdit('time', e as unknown as MouseEvent); }}
            title="Klik om starttijd aan te passen"
            onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdfa'; }}
            onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            {activity.time}
          </span>
        {:else if !isDragging}
          <!-- Subtle "+ tijd" hint, only visible on hover -->
          <span
            role="button"
            tabindex="0"
            class="text-xs flex-shrink-0 rounded-lg px-1.5 py-0.5 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
            style="color: #c4bfb9;"
            onclick={(e) => startInlineEdit('time', e)}
            onkeydown={(e) => { if (e.key === 'Enter') startInlineEdit('time', e as unknown as MouseEvent); }}
            title="Starttijd toevoegen"
            onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0d9488'; }}
            onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.color = '#c4bfb9'; }}
          >
            + tijd
          </span>
        {/if}
      </div>

      <!-- Row 2: subline + inline-editable duration -->
      <div class="flex items-center justify-between gap-2 mt-0.5">
        {#if subline()}
          <p class="text-xs truncate flex-1" style="color: #a09e98;">{subline()}</p>
        {:else}
          <span class="flex-1"></span>
        {/if}

        <!-- Inline duration editor -->
        {#if inlineField === 'duration'}
          <input
            bind:value={inlineValue}
            onblur={saveInlineEdit}
            onkeydown={handleInlineKeydown}
            use:focusEl
            onclick={(e) => e.stopPropagation()}
            placeholder="bijv. 2u"
            class="text-xs w-16 text-center rounded-lg px-2 py-0.5 focus:outline-none flex-shrink-0"
            style="color: #a09e98; background: #f4f3ef; border: 1px solid #e8e6e0;"
          />
        {:else if activity.duration}
          <span
            role="button"
            tabindex="0"
            class="text-xs flex-shrink-0 rounded-lg px-1.5 py-0.5 cursor-pointer transition-colors"
            style="color: #a09e98;"
            onclick={(e) => startInlineEdit('duration', e)}
            onkeydown={(e) => { if (e.key === 'Enter') startInlineEdit('duration', e as unknown as MouseEvent); }}
            title="Klik om duur aan te passen"
            onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
            onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            ⏱ {activity.duration}
          </span>
        {:else if !isDragging}
          <!-- Subtle "+ duur" hint, only visible on hover -->
          <span
            role="button"
            tabindex="0"
            class="text-xs flex-shrink-0 rounded-lg px-1.5 py-0.5 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
            style="color: #c4bfb9;"
            onclick={(e) => startInlineEdit('duration', e)}
            onkeydown={(e) => { if (e.key === 'Enter') startInlineEdit('duration', e as unknown as MouseEvent); }}
            title="Duur toevoegen"
            onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.color = '#a09e98'; }}
            onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.color = '#c4bfb9'; }}
          >
            + duur
          </span>
        {/if}
      </div>
    </div>

    <!-- ── Expanded drawer ────────────────────────────────────────────────── -->
    {#if expanded}
      {#if chatOpen}
        <!-- ── AI Chat ──────────────────────────────────────────────────── -->
        <AIChatDrawer {activity} onClose={() => { chatOpen = false; }} />
      {:else}
        <!-- ── Detail view ───────────────────────────────────────────────── -->
        <div
          class="rounded-b-2xl px-4 py-3"
          style="background-color: var(--clr-surface, white); border: 1px solid #c4f1ea; border-top: none;"
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
