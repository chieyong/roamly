<script lang="ts">
  import { currentTheme, presets, fontOptions } from '$lib/stores/theme';
  import type { ThemePresetWithMode } from '$lib/stores/theme';

  let { onClose }: { onClose: () => void } = $props();

  // Licht/Donker toggle — volgt het actieve thema
  const showDark = $derived($currentTheme.isDark ?? false);

  // Thema's gefilterd op modus
  const visiblePresets = $derived(presets.filter(p => p.isDark === showDark));

  /** Returns the CSS font-family stack for a preset's header font. */
  function headerFontStack(fontId: string): string {
    return fontOptions.find(f => f.id === fontId)?.stack ?? "'Inter', sans-serif";
  }

  function applyPreset(preset: ThemePresetWithMode) {
    currentTheme.set({ ...preset });
  }

  function toggleDarkMode() {
    const current = $currentTheme as ThemePresetWithMode;
    const partnerId = current.darkId ?? (showDark ? 'ivory' : 'ivory-dark');
    const partner = presets.find(p => p.id === partnerId);
    if (partner) currentTheme.set({ ...partner });
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!--
  Instellingen panel — rechts op het scherm.
  Hardcoded kleuren zodat het panel zelf niet mee-themet.
-->
<div
  class="fixed top-0 right-0 h-full flex flex-col"
  style="z-index: 1500; width: 280px; background-color: #ffffff; border-left: 1px solid #e8e6e0; box-shadow: -4px 0 24px rgba(0,0,0,0.10); overflow: hidden;"
  role="dialog"
  aria-modal="true"
  aria-label="Instellingen"
>
  <!-- Header -->
  <div class="flex items-center justify-between px-5 py-4 flex-shrink-0" style="border-bottom: 1px solid #f0eeea;">
    <h2 class="text-sm font-semibold" style="color: #1a1917;">Instellingen</h2>
    <button
      onclick={onClose}
      class="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors"
      style="color: #a09e98;"
      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >✕</button>
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 overflow-y-auto px-5 py-5 space-y-6">

    <!-- ── Licht / Donker toggle ────────────────────────────────────── -->
    <div>
      <p class="text-xs font-semibold mb-3 uppercase tracking-wide" style="color: #a09e98;">Modus</p>
      <div class="flex gap-2">
        <button
          onclick={() => { if (showDark) toggleDarkMode(); }}
          class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
          style="
            background: {!showDark ? '#1a1917' : '#f4f3ef'};
            color: {!showDark ? 'white' : '#8b8a84'};
            border: 1.5px solid {!showDark ? '#1a1917' : 'transparent'};
          "
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="8" cy="8" r="3.5"/>
            <line x1="8" y1="1" x2="8" y2="3"/>
            <line x1="8" y1="13" x2="8" y2="15"/>
            <line x1="1" y1="8" x2="3" y2="8"/>
            <line x1="13" y1="8" x2="15" y2="8"/>
            <line x1="3.2" y1="3.2" x2="4.6" y2="4.6"/>
            <line x1="11.4" y1="11.4" x2="12.8" y2="12.8"/>
            <line x1="12.8" y1="3.2" x2="11.4" y2="4.6"/>
            <line x1="4.6" y1="11.4" x2="3.2" y2="12.8"/>
          </svg>
          Licht
        </button>
        <button
          onclick={() => { if (!showDark) toggleDarkMode(); }}
          class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
          style="
            background: {showDark ? '#1a1917' : '#f4f3ef'};
            color: {showDark ? 'white' : '#8b8a84'};
            border: 1.5px solid {showDark ? '#1a1917' : 'transparent'};
          "
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z"/>
          </svg>
          Donker
        </button>
      </div>
    </div>

    <!-- ── Thema's ──────────────────────────────────────────────────── -->
    <div>
      <p class="text-xs font-semibold mb-3 uppercase tracking-wide" style="color: #a09e98;">Thema</p>
      <div class="flex flex-col gap-2.5">
        {#each visiblePresets as preset}
          {@const isActive = $currentTheme.id === preset.id}
          <button
            onclick={() => applyPreset(preset)}
            class="rounded-2xl overflow-hidden text-left transition-all"
            style="
              border: 2px solid {isActive ? preset.accent : preset.border};
              box-shadow: {isActive ? `0 0 0 2px ${preset.accent}40` : 'none'};
              outline: none;
            "
          >
            <div style="display: flex; align-items: stretch;">
              <!-- Colour swatch: accent stripe left -->
              <div style="width: 6px; background: {preset.accent}; flex-shrink: 0;"></div>

              <!-- Preview -->
              <div style="background: {preset.bg}; flex: 1; padding: 10px 12px 10px 10px; display: flex; align-items: center; gap: 10px;">
                <!-- Mini card stack -->
                <div style="flex-shrink: 0; width: 44px;">
                  <div style="background: {preset.surface}; border: 1px solid {preset.border}; border-radius: 6px; padding: 5px 6px; margin-bottom: 3px;">
                    <div style="height: 3px; width: 30px; border-radius: 2px; background: {preset.text}; margin-bottom: 3px; opacity: 0.5;"></div>
                    <div style="height: 3px; width: 20px; border-radius: 2px; background: {preset.textMuted}; opacity: 0.4;"></div>
                  </div>
                  <div style="height: 3px; width: 44px; border-radius: 2px; background: {preset.accent}; opacity: 0.7;"></div>
                </div>

                <!-- Name + tagline in theme font -->
                <div style="flex: 1; min-width: 0;">
                  <p style="font-size: 13px; font-weight: 700; color: {preset.text}; line-height: 1.2; font-family: {headerFontStack(preset.fontHeaderId)};">
                    {preset.name}
                  </p>
                  <p style="font-size: 10px; color: {preset.textMuted}; margin-top: 2px; line-height: 1.3;">{preset.tagline}</p>
                </div>

                <!-- Active checkmark -->
                {#if isActive}
                  <div style="width: 18px; height: 18px; border-radius: 50%; background: {preset.accent}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" stroke-width="2">
                      <path d="M2 5l2 2 4-4"/>
                    </svg>
                  </div>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>

  </div>
</div>
