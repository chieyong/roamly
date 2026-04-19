<script lang="ts">
  import { createNewTrip } from '$lib/stores/trip';
  import DateRangePicker from '$lib/components/DateRangePicker.svelte';

  let { onClose }: { onClose: () => void } = $props();

  let name      = $state('');
  let startDate = $state('');
  let endDate   = $state('');

  const valid = $derived(name.trim().length > 0 && !!startDate && !!endDate && startDate < endDate);

  function save() {
    if (!valid) return;
    createNewTrip(name.trim(), startDate, endDate);
    onClose();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
  style="background-color: rgba(0,0,0,0.3); backdrop-filter: blur(2px);"
  role="dialog"
  aria-modal="true"
>
  <div
    class="w-full max-w-md rounded-3xl flex flex-col"
    style="background-color: white; box-shadow: 0 8px 40px rgba(0,0,0,0.14); max-height: 90vh;"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0" style="border-bottom: 1px solid #f0eeea;">
      <h2 class="text-sm font-semibold" style="color: #1a1917;">Nieuwe reis aanmaken</h2>
      <button onclick={onClose} class="text-xs px-2 py-1 rounded-lg" style="color: #b0ada7;">✕</button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">

      <!-- Naam -->
      <div>
        <label class="text-xs block mb-1.5" for="new-trip-name" style="color: #8b8a84;">Naam van de reis</label>
        <input
          id="new-trip-name"
          type="text"
          bind:value={name}
          placeholder="bijv. Japan Voorjaar 2026"
          class="w-full text-sm rounded-2xl px-4 py-2.5 outline-none"
          style="background-color: #f4f3ef; border: 1.5px solid #e8e6e0; color: #1a1917;"
        />
      </div>

      <!-- Periode (kalender) -->
      <div>
        <p class="text-xs mb-1.5" style="color: #8b8a84;">Periode</p>
        <div class="rounded-2xl p-3" style="background-color: #f4f3ef; border: 1.5px solid #e8e6e0;">
          <DateRangePicker bind:startDate bind:endDate />
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="flex gap-2 px-6 py-4 flex-shrink-0" style="border-top: 1px solid #f0eeea;">
      <button
        onclick={save}
        disabled={!valid}
        class="flex-1 text-xs py-2.5 rounded-2xl font-medium transition-all"
        style="background-color: {valid ? '#1a1917' : '#d4d1c8'}; color: white;"
      >Reis aanmaken</button>
      <button
        onclick={onClose}
        class="text-xs px-4 py-2.5 rounded-2xl"
        style="color: #8b8a84; background: #f4f3ef;"
      >Annuleren</button>
    </div>
  </div>
</div>
