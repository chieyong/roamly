<script lang="ts">
  import { trip, locations, updateTrip, addLocation, updateLocation, removeLocation } from '$lib/stores/trip';
  import { get } from 'svelte/store';
  import type { Location } from '$lib/types';
  import DateRangePicker from '$lib/components/DateRangePicker.svelte';

  let { onClose }: { onClose: () => void } = $props();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  type Tab = 'reis' | 'steden';
  let activeTab = $state<Tab>('reis');

  // ── Reis tab ──────────────────────────────────────────────────────────────
  let tripName  = $state(get(trip).name);
  let tripStart = $state(get(trip).startDate);
  let tripEnd   = $state(get(trip).endDate);

  function saveTrip() {
    if (!tripName.trim()) return;
    updateTrip({ name: tripName.trim(), startDate: tripStart, endDate: tripEnd });
    onClose();
  }

  // ── Steden tab ────────────────────────────────────────────────────────────
  const colorOptions = [
    { cls: 'bg-teal-100',   hex: '#14b8a6' },
    { cls: 'bg-blue-100',   hex: '#3b82f6' },
    { cls: 'bg-amber-100',  hex: '#f59e0b' },
    { cls: 'bg-rose-100',   hex: '#f43f5e' },
    { cls: 'bg-purple-100', hex: '#a855f7' },
    { cls: 'bg-green-100',  hex: '#22c55e' },
  ];

  function colorHex(cls: string): string {
    return colorOptions.find((c) => c.cls === cls)?.hex ?? '#a09e98';
  }

  function usedColors(): string[] {
    return get(locations).map((l) => l.color);
  }

  function nextColor(): string {
    const used = usedColors();
    return colorOptions.find((c) => !used.includes(c.cls))?.cls ?? colorOptions[0].cls;
  }

  function countDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end   + 'T00:00:00');
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
  }

  // Edit state per location (null = not editing)
  let editingId    = $state<string | null>(null);
  let showAddForm  = $state(false);
  let shiftedNames = $state<string[]>([]); // steden die automatisch zijn verschoven

  // Shared form state for both edit and add
  let formName  = $state('');
  let formStart = $state('');
  let formEnd   = $state('');
  let formColor = $state('bg-teal-100');

  /** Format a Date as YYYY-MM-DD using LOCAL date parts (avoids UTC timezone shift). */
  function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }

  function startAdd() {
    editingId    = null;
    formName     = '';
    formStart    = get(trip).startDate;
    formEnd      = '';
    formColor    = nextColor();
    showAddForm  = true;
    shiftedNames = [];
  }

  function startEdit(loc: Location) {
    showAddForm  = false;
    editingId    = loc.id;
    formName     = loc.name;
    formStart    = loc.startDate;
    formEnd      = loc.endDate;
    formColor    = loc.color;
    shiftedNames = [];
  }

  function cancelForm() {
    editingId    = null;
    showAddForm  = false;
    shiftedNames = [];
  }

  function saveLocation() {
    if (!formValid) return;

    // Snapshot dates before mutation so we can detect shifts
    const before = get(locations).map((l) => ({
      id: l.id, name: l.name, emoji: l.emoji, startDate: l.startDate, endDate: l.endDate,
    }));
    const savedId = editingId; // capture before we clear it

    if (editingId) {
      const existing = get(locations).find((l) => l.id === editingId);
      if (existing) {
        updateLocation({
          ...existing,
          name:      formName.trim(),
          startDate: formStart,
          endDate:   formEnd,
          color:     formColor,
        });
      }
      editingId = null;
    } else {
      const tripId = get(trip).id;
      const newLoc: Location = {
        id:        `loc-${Date.now()}`,
        tripId,
        name:      formName.trim(),
        country:   '',
        emoji:     '',
        startDate: formStart,
        endDate:   formEnd,
        color:     formColor,
      };
      addLocation(newLoc);
      showAddForm = false;
    }

    // Detect which existing locations were auto-shifted by resolveConflicts
    const after = get(locations);
    const shifted: string[] = [];
    for (const loc of after) {
      const prev = before.find((b) => b.id === loc.id);
      if (!prev) continue; // new location — skip
      if (loc.id === savedId) continue; // the one the user just edited — skip
      if (prev.startDate !== loc.startDate || prev.endDate !== loc.endDate) {
        const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
        shifted.push(`${loc.name}: ${fmt(loc.startDate)} – ${fmt(loc.endDate)}`);
      }
    }
    shiftedNames = shifted;
  }

  function confirmRemove(locId: string, locName: string) {
    if (confirm(`"${locName}" verwijderen? Activiteiten worden naar de misschien-lijst verplaatst.`)) {
      removeLocation(locId);
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (editingId || showAddForm) { cancelForm(); }
      else { onClose(); }
    }
  }

  // Form valid check
  const formValid = $derived(
    formName.trim().length > 0 && formStart && formEnd && formStart < formEnd
  );
</script>

<svelte:window onkeydown={handleKey} />

<!-- Backdrop -->
<div
  class="fixed inset-0 flex items-end sm:items-center justify-center p-4"
  style="z-index: 1000; background-color: rgba(0,0,0,0.3); backdrop-filter: blur(2px);"
  role="dialog"
  aria-modal="true"
>
  <div
    class="w-full max-w-md rounded-3xl flex flex-col"
    style="background-color: white; box-shadow: 0 8px 40px rgba(0,0,0,0.14); max-height: 90vh;"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
      <h2 class="text-sm font-semibold" style="color: #1a1917;">Reis bewerken</h2>
      <button onclick={onClose} class="text-xs px-2 py-1 rounded-lg" style="color: #b0ada7;">✕</button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
      {#each [['reis', 'Reis'], ['steden', 'Steden']] as [key, label]}
        <button
          onclick={() => { activeTab = key as Tab; cancelForm(); }}
          class="text-xs px-4 py-1.5 rounded-xl font-medium transition-all"
          style="{activeTab === key
            ? 'background-color: #1a1917; color: white;'
            : 'color: #8b8a84; background-color: transparent;'}"
        >{label}</button>
      {/each}
    </div>

    <!-- Content (scrollable) -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">

      {#if activeTab === 'reis'}
        <!-- ── Reis tab ──────────────────────────────────────────────────── -->

        <!-- Naam -->
        <div>
          <label class="text-xs block mb-1.5" style="color: #8b8a84;">Naam</label>
          <input
            type="text"
            bind:value={tripName}
            placeholder="bijv. Japan Voorjaar 2026"
            class="w-full text-sm rounded-2xl px-4 py-2.5 outline-none"
            style="background-color: #f4f3ef; border: 1.5px solid #e8e6e0; color: #1a1917;"
          />
        </div>

        <!-- Periode (kalender) -->
        <div>
          <label class="text-xs block mb-1.5" style="color: #8b8a84;">Periode</label>
          <div class="rounded-2xl p-3" style="background-color: #f4f3ef; border: 1.5px solid #e8e6e0;">
            <DateRangePicker bind:startDate={tripStart} bind:endDate={tripEnd} />
          </div>
        </div>

        <button
          onclick={saveTrip}
          disabled={!tripName.trim()}
          class="w-full text-xs py-2.5 rounded-2xl font-medium transition-all"
          style="background-color: {tripName.trim() ? '#1a1917' : '#d4d1c8'}; color: white;"
        >Opslaan</button>

      {:else}
        <!-- ── Steden tab ─────────────────────────────────────────────────── -->

        <!-- Auto-shift notificatie -->
        {#if shiftedNames.length > 0}
          <div class="rounded-2xl px-4 py-3" style="background: #f0fdfa; border: 1px solid #99f6e4;">
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <p class="text-xs font-semibold" style="color: #0d9488;">🔄 Automatisch verschoven</p>
              <button
                onclick={() => shiftedNames = []}
                class="text-xs flex-shrink-0"
                style="color: #5eead4; line-height: 1;"
              >✕</button>
            </div>
            {#each shiftedNames as entry}
              <p class="text-xs" style="color: #0f766e;">{entry}</p>
            {/each}
          </div>
        {/if}

        <!-- Bestaande steden -->
        {#each $locations as loc (loc.id)}
          {#if editingId === loc.id}
            <!-- ── Inline edit form ── -->
            <div class="rounded-2xl p-4 space-y-3" style="border: 1.5px solid #0d9488; background: #f8fffe;">
              {@render locationForm('Wijzigingen opslaan')}
            </div>
          {:else}
            <!-- ── Location row ── -->
            <div
              class="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style="border: 1px solid #f0eeea; background: #fafaf8;"
            >
              <!-- Kleurpunt -->
              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background: {colorHex(loc.color)};"></div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold truncate" style="color: #1a1917;">{loc.name}</p>
                <p class="text-xs" style="color: #a09e98;">
                  {new Date(loc.startDate + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  –
                  {new Date(loc.endDate + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  · {countDays(loc.startDate, loc.endDate)} {countDays(loc.startDate, loc.endDate) === 1 ? 'dag' : 'dagen'}
                </p>
              </div>
              <!-- Acties -->
              <button
                onclick={() => startEdit(loc)}
                class="text-xs px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                style="color: #8b8a84;"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f0eeea'; }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >✏️</button>
              <button
                onclick={() => confirmRemove(loc.id, loc.name)}
                class="text-xs px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                style="color: #c4b8b8;"
                onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#fff1f2'; }}
                onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >🗑</button>
            </div>
          {/if}
        {/each}

        <!-- Voeg stad toe form / knop -->
        {#if showAddForm}
          <div class="rounded-2xl p-4 space-y-3" style="border: 1.5px dashed #0d9488; background: #f8fffe;">
            {@render locationForm('Stad toevoegen')}
          </div>
        {:else if !editingId}
          <button
            onclick={startAdd}
            class="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-2xl font-medium transition-all"
            style="border: 1.5px dashed #d4d1c8; color: #8b8a84;"
            onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#0d9488'; (e.currentTarget as HTMLElement).style.color = '#0d9488'; }}
            onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#d4d1c8'; (e.currentTarget as HTMLElement).style.color = '#8b8a84'; }}
          >
            + Stad toevoegen
          </button>
        {/if}

      {/if}
    </div>
  </div>
</div>

{#snippet locationForm(saveLabel: string)}
  <!-- Naam -->
  <div>
    <label class="text-xs block mb-1" style="color: #8b8a84;">Stadnaam</label>
    <input
      type="text"
      bind:value={formName}
      placeholder="bijv. Kyoto"
      class="w-full text-sm rounded-xl px-3 py-2 outline-none"
      style="background-color: white; border: 1.5px solid #e8e6e0; color: #1a1917;"
    />
  </div>

  <!-- Periode (kalender) -->
  <div>
    <label class="text-xs block mb-1" style="color: #8b8a84;">Periode</label>
    <div class="rounded-xl p-3" style="background-color: white; border: 1.5px solid #e8e6e0;">
      <DateRangePicker bind:startDate={formStart} bind:endDate={formEnd} />
    </div>
  </div>

  {#if formStart && formEnd && formStart >= formEnd}
    <p class="text-xs" style="color: #f43f5e;">Vertrekdatum moet na aankomst liggen</p>
  {/if}

  <!-- Kleur -->
  <div>
    <p class="text-xs mb-1.5" style="color: #8b8a84;">Kleur</p>
    <div class="flex gap-2">
      {#each colorOptions as opt}
        <button
          onclick={() => { formColor = opt.cls; }}
          class="w-7 h-7 rounded-full transition-all"
          style="background: {opt.hex}; border: 2.5px solid {formColor === opt.cls ? '#1a1917' : 'transparent'}; box-shadow: {formColor === opt.cls ? '0 0 0 1px white inset' : 'none'};"
          aria-label={opt.cls}
        ></button>
      {/each}
    </div>
  </div>

  <!-- Knoppen -->
  <div class="flex gap-2">
    <button
      onclick={saveLocation}
      disabled={!formValid}
      class="flex-1 text-xs py-2 rounded-xl font-medium transition-all"
      style="background-color: {formValid ? '#0d9488' : '#d4d1c8'}; color: white;"
    >{saveLabel}</button>
    <button
      onclick={cancelForm}
      class="text-xs px-4 py-2 rounded-xl"
      style="color: #8b8a84; background: #f4f3ef;"
    >Annuleren</button>
  </div>
{/snippet}
