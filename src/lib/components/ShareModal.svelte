<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { trip, days, activities } from '$lib/stores/trip';
  import { createShareLink } from '$lib/firebase/firestore';
  import { get } from 'svelte/store';

  let { onClose }: { onClose: () => void } = $props();

  type ShareState = 'idle' | 'creating' | 'done' | 'error';
  let shareStatus: ShareState = $state('idle');
  let shareUrl  = $state('');
  let copied    = $state(false);
  let editRights = $state(false); // false = alleen lezen, true = bewerken

  async function createLink() {
    const u = get(user);
    if (!u) return;
    shareStatus = 'creating';
    try {
      const shareId = await createShareLink(
        u.uid,
        u.displayName ?? 'Reiziger',
        get(trip),
        get(days),
        get(activities),
        editRights
      );
      shareUrl = `${window.location.origin}/share/${shareId}`;
      shareStatus = 'done';
    } catch {
      shareStatus = 'error';
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
  style="background-color: rgba(0,0,0,0.3); backdrop-filter: blur(2px);"
  role="dialog"
  aria-modal="true"
>
  <div
    class="w-full max-w-sm rounded-3xl p-6 space-y-5"
    style="background-color: white; box-shadow: 0 8px 40px rgba(0,0,0,0.14);"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold" style="color: #1a1917;">Planning delen</h2>
      <button onclick={onClose} class="text-xs px-2 py-1 rounded-lg" style="color: #b0ada7;">✕</button>
    </div>

    {#if !$user}
      <!-- Niet ingelogd -->
      <div class="text-center py-4 space-y-2">
        <p class="text-sm" style="color: #57564f;">Je moet ingelogd zijn om een link te delen.</p>
      </div>

    {:else if shareStatus === 'idle'}
      <!-- Kies rechten -->
      <div class="space-y-3">
        <p class="text-xs" style="color: #8b8a84;">Kies welke rechten de ontvanger krijgt:</p>

        <div class="space-y-2">
          <label
            class="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors"
            style="border: 1px solid {!editRights ? '#0d9488' : '#e8e6e0'}; background-color: {!editRights ? '#f0fdfa' : 'white'};"
          >
            <input type="radio" bind:group={editRights} value={false} class="sr-only" />
            <div>
              <p class="text-xs font-medium" style="color: #1a1917;">👁 Alleen lezen</p>
              <p class="text-xs" style="color: #a09e98;">Ontvanger kan de planning bekijken, niet bewerken</p>
            </div>
          </label>

          <label
            class="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors"
            style="border: 1px solid {editRights ? '#0d9488' : '#e8e6e0'}; background-color: {editRights ? '#f0fdfa' : 'white'};"
          >
            <input type="radio" bind:group={editRights} value={true} class="sr-only" />
            <div>
              <p class="text-xs font-medium" style="color: #1a1917;">✏️ Bewerken toegestaan</p>
              <p class="text-xs" style="color: #a09e98;">Ontvanger kan activiteiten toevoegen en aanpassen</p>
            </div>
          </label>
        </div>

        <button
          onclick={createLink}
          class="w-full text-xs py-2.5 rounded-2xl font-medium transition-colors"
          style="background-color: #1a1917; color: white;"
        >
          Link aanmaken
        </button>
      </div>

    {:else if shareStatus === 'creating'}
      <div class="flex items-center justify-center py-6 gap-2" style="color: #a09e98;">
        <span class="text-xs">Link aanmaken…</span>
        <span class="flex gap-0.5">
          <span class="w-1.5 h-1.5 rounded-full animate-bounce bg-current" style="animation-delay: 0ms;"></span>
          <span class="w-1.5 h-1.5 rounded-full animate-bounce bg-current" style="animation-delay: 150ms;"></span>
          <span class="w-1.5 h-1.5 rounded-full animate-bounce bg-current" style="animation-delay: 300ms;"></span>
        </span>
      </div>

    {:else if shareStatus === 'done'}
      <!-- Link klaar -->
      <div class="space-y-3">
        <p class="text-xs" style="color: #8b8a84;">
          {editRights ? 'Bewerklink aangemaakt' : 'Leeslink aangemaakt'} — deel met wie je wil:
        </p>
        <div
          class="flex items-center gap-2 p-3 rounded-2xl"
          style="background-color: #f4f3ef; border: 1px solid #e8e6e0;"
        >
          <span class="text-xs flex-1 truncate" style="color: #57564f;">{shareUrl}</span>
          <button
            onclick={copyLink}
            class="text-xs px-3 py-1.5 rounded-xl font-medium flex-shrink-0 transition-colors"
            style="background-color: {copied ? '#0d9488' : '#1a1917'}; color: white;"
          >
            {copied ? 'Gekopieerd!' : 'Kopieer'}
          </button>
        </div>
        <button
          onclick={() => { shareStatus = 'idle'; shareUrl = ''; }}
          class="text-xs" style="color: #a09e98;"
        >Nieuwe link aanmaken</button>
      </div>

    {:else}
      <p class="text-xs text-center py-4" style="color: #d97706;">Er is iets misgegaan. Probeer opnieuw.</p>
      <button onclick={() => { shareStatus = 'idle'; }} class="text-xs" style="color: #a09e98;">Opnieuw proberen</button>
    {/if}
  </div>
</div>
