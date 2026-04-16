<script lang="ts">
  import { currentTheme, presets, fontOptions } from '$lib/stores/theme';
  import type { ThemePreset } from '$lib/stores/theme';

  let { onClose }: { onClose: () => void } = $props();

  type Category = 'uiterlijk';
  let activeCategory = $state<Category>('uiterlijk');
  let openPickerKey  = $state<keyof ThemePreset | null>(null);

  // Live-update individual color fields
  function setColor(key: keyof ThemePreset, value: string) {
    let finalValue = value;
    // headerBg preserves semi-transparency for the frosted glass effect
    if (key === 'headerBg' && value.startsWith('#')) {
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      finalValue = `rgba(${r},${g},${b},0.92)`;
    }
    currentTheme.update(t => ({ ...t, id: 'custom', name: 'Aangepast', [key]: finalValue }));
    openPickerKey = null;
  }

  // Apply a full preset (keep current font choices)
  function applyPreset(preset: ThemePreset) {
    openPickerKey = null;
    currentTheme.update(t => ({
      ...preset,
      fontHeaderId: t.fontHeaderId,
      fontBodyId:   t.fontBodyId,
    }));
  }

  function setFont(type: 'fontHeaderId' | 'fontBodyId', id: string) {
    currentTheme.update(t => ({ ...t, [type]: id }));
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (openPickerKey) { openPickerKey = null; return; }
      onClose();
    }
  }

  // Convert any CSS color string to a displayable hex (handles rgba)
  function colorToHex(color: string): string {
    if (!color) return '#ffffff';
    if (color.startsWith('#')) return color.slice(0, 7); // strip alpha if any
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      return '#' + [m[1], m[2], m[3]]
        .map(n => parseInt(n).toString(16).padStart(2, '0'))
        .join('');
    }
    return '#ffffff';
  }

  // 30-color curated palette — covers neutrals, tints, accents, darks
  const palette: string[] = [
    // Whites & light neutrals
    '#ffffff', '#fafaf8', '#f8f9fa', '#f4f3ef', '#f0f4f8', '#f2f7f2',
    // Medium neutrals
    '#e8e6e0', '#dee2e6', '#c5d3e0', '#d4d1c8', '#a09e98', '#868e96',
    // Light tints (accent backgrounds)
    '#f0fdfa', '#f0fdf4', '#eff6ff', '#faf5ff', '#fff1f2', '#fffbeb',
    // Saturated brand colors
    '#0d9488', '#16a34a', '#3b82f6', '#7c3aed', '#f43f5e', '#f59e0b',
    // Dark neutrals
    '#57564f', '#334155', '#1e293b', '#1a1917', '#0f1117', '#1a1d27',
  ];

  // Which color fields to expose in the color section
  const colorFields: { key: keyof ThemePreset; label: string }[] = [
    { key: 'bg',          label: 'Pagina achtergrond' },
    { key: 'headerBg',    label: 'Header achtergrond' },
    { key: 'surface',     label: 'Kaarten / blokken' },
    { key: 'surfaceAlt',  label: 'Subtiele vlakken' },
    { key: 'border',      label: 'Randen' },
    { key: 'accent',      label: 'Accentkleur' },
    { key: 'accentLight', label: 'Accent achtergrond' },
    { key: 'text',        label: 'Tekst' },
    { key: 'textMuted',   label: 'Gedimde tekst' },
  ];
</script>

<svelte:window onkeydown={handleKey} />

<!--
  Right-side panel.
  All colors are HARDCODED (no CSS vars) so theme changes don't affect the panel itself.
  No backdrop overlay — main content stays fully visible for live preview.
-->
<div
  class="fixed top-0 right-0 h-full z-50 flex flex-col"
  style="
    width: 300px;
    background-color: #ffffff;
    border-left: 1px solid #e8e6e0;
    box-shadow: -4px 0 24px rgba(0,0,0,0.10);
    overflow: hidden;
  "
  role="dialog"
  aria-modal="true"
  aria-label="Instellingen"
>
  <!-- Header -->
  <div
    class="flex items-center justify-between px-5 py-4 flex-shrink-0"
    style="border-bottom: 1px solid #f0eeea;"
  >
    <h2 class="text-sm font-semibold" style="color: #1a1917; font-family: 'Inter', system-ui, sans-serif;">
      Instellingen
    </h2>
    <button
      onclick={onClose}
      class="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors"
      style="color: #a09e98;"
      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >✕</button>
  </div>

  <!-- Category tabs -->
  <div
    class="flex px-5 pt-3 pb-0 gap-1 flex-shrink-0"
    style="border-bottom: 1px solid #f0eeea;"
  >
    {#each [['uiterlijk', 'Uiterlijk']] as [key, label]}
      <button
        onclick={() => { activeCategory = key as Category; }}
        class="text-xs px-3 py-1.5 rounded-t-lg font-medium transition-all"
        style="{activeCategory === key
          ? 'border-bottom: 2px solid #0d9488; color: #0d9488; margin-bottom: -1px;'
          : 'color: #a09e98;'}"
      >{label}</button>
    {/each}
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 overflow-y-auto">

    {#if activeCategory === 'uiterlijk'}

      <!-- ── Kleurthema ─────────────────────────────────────────────────── -->
      <section class="px-5 py-4" style="border-bottom: 1px solid #f0eeea;">
        <p class="text-xs font-semibold mb-3" style="color: #a09e98; letter-spacing: 0.06em; text-transform: uppercase;">
          Kleurthema
        </p>
        <div class="grid grid-cols-2 gap-2">
          {#each presets as preset}
            {@const isActive = $currentTheme.id === preset.id}
            <button
              onclick={() => applyPreset(preset)}
              class="rounded-xl overflow-hidden text-left transition-all"
              style="
                border: 2px solid {isActive ? preset.accent : preset.border};
                box-shadow: {isActive ? `0 0 0 1px ${preset.accent}` : 'none'};
              "
            >
              <!-- Mini preview -->
              <div style="background: {preset.bg}; padding: 8px 8px 5px;">
                <div style="background: {preset.surface}; border-radius: 6px; padding: 5px 7px; border: 1px solid {preset.border};">
                  <div class="flex items-center gap-1 mb-1">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: {preset.accent};"></div>
                    <div style="height: 4px; width: 36px; border-radius: 2px; background: {preset.border};"></div>
                  </div>
                  <div style="height: 3px; width: 44px; border-radius: 2px; background: {preset.borderLight};"></div>
                  <div style="height: 3px; width: 28px; border-radius: 2px; background: {preset.borderLight}; margin-top: 2px;"></div>
                </div>
              </div>
              <!-- Label -->
              <div style="background: {preset.surfaceAlt}; padding: 4px 8px 6px; border-top: 1px solid {preset.border};">
                <p class="text-xs font-medium leading-tight" style="color: {preset.text};">{preset.name}</p>
                {#if isActive}
                  <p style="font-size: 10px; color: {preset.accent};">Actief ✓</p>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </section>

      <!-- ── Kleuren aanpassen ──────────────────────────────────────────── -->
      <section class="px-5 py-4" style="border-bottom: 1px solid #f0eeea;">
        <p class="text-xs font-semibold mb-3" style="color: #a09e98; letter-spacing: 0.06em; text-transform: uppercase;">
          Kleuren aanpassen
        </p>
        <div>
          {#each colorFields as field}
            {@const currentHex = colorToHex($currentTheme[field.key] as string)}
            {@const isOpen = openPickerKey === field.key}

            <!-- Label + swatch row -->
            <div
              class="flex items-center justify-between py-1.5"
              style="{isOpen ? 'padding-bottom: 0;' : ''}"
            >
              <span class="text-xs" style="color: #1a1917;">{field.label}</span>
              <button
                onclick={() => { openPickerKey = isOpen ? null : field.key; }}
                class="w-7 h-7 rounded-lg border-2 flex-shrink-0 transition-all"
                style="
                  background: {currentHex};
                  border-color: {isOpen ? '#1a1917' : '#e8e6e0'};
                  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
                "
                title={field.label}
              ></button>
            </div>

            <!-- Inline palette (shown when this field is active) -->
            {#if isOpen}
              <div class="pb-3 pt-2">
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px;">
                  {#each palette as color}
                    {@const isSelected = currentHex === color}
                    <button
                      onclick={() => setColor(field.key, color)}
                      style="
                        width: 100%; aspect-ratio: 1;
                        border-radius: 6px;
                        background: {color};
                        border: 2px solid {isSelected ? '#1a1917' : (color === '#ffffff' || color === '#fafaf8' || color === '#f8f9fa' ? '#e8e6e0' : 'transparent')};
                        transition: transform 0.1s;
                        box-shadow: {isSelected ? 'inset 0 0 0 1.5px rgba(255,255,255,0.5)' : 'none'};
                      "
                      onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
                      onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    ></button>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </section>

      <!-- ── Lettertype ────────────────────────────────────────────────── -->
      <section class="px-5 py-4">
        <p class="text-xs font-semibold mb-3" style="color: #a09e98; letter-spacing: 0.06em; text-transform: uppercase;">
          Lettertype
        </p>

        <!-- Header font -->
        <div class="mb-4">
          <p class="text-xs mb-2" style="color: #57564f;">Headers</p>
          <div class="flex flex-col gap-1.5">
            {#each fontOptions as font}
              {@const isActive = $currentTheme.fontHeaderId === font.id}
              <button
                onclick={() => setFont('fontHeaderId', font.id)}
                class="text-left px-3 py-2 rounded-xl text-sm transition-all"
                style="
                  font-family: {font.stack};
                  background-color: {isActive ? '#f0fdfa' : '#f4f3ef'};
                  border: 1.5px solid {isActive ? '#0d9488' : 'transparent'};
                  color: {isActive ? '#0d9488' : '#1a1917'};
                "
              >{font.name}</button>
            {/each}
          </div>
        </div>

        <!-- Body font -->
        <div>
          <p class="text-xs mb-2" style="color: #57564f;">Tekst / content</p>
          <div class="flex flex-col gap-1.5">
            {#each fontOptions as font}
              {@const isActive = $currentTheme.fontBodyId === font.id}
              <button
                onclick={() => setFont('fontBodyId', font.id)}
                class="text-left px-3 py-2 rounded-xl text-sm transition-all"
                style="
                  font-family: {font.stack};
                  background-color: {isActive ? '#f0fdfa' : '#f4f3ef'};
                  border: 1.5px solid {isActive ? '#0d9488' : 'transparent'};
                  color: {isActive ? '#0d9488' : '#1a1917'};
                "
              >{font.name}</button>
            {/each}
          </div>
        </div>
      </section>

    {/if}

  </div>
</div>
