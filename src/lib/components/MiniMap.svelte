<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { LatLng } from '$lib/utils/coordinates';
  import { TOKYO_CENTER } from '$lib/utils/coordinates';

  let {
    coord = null,
    zoom = 14,
    label = '',
  }: {
    coord?: LatLng | null;
    zoom?: number;
    label?: string;
  } = $props();

  let mapEl: HTMLDivElement;
  let L: typeof import('leaflet') | null = null;
  let map: import('leaflet').Map | null = null;
  let marker: import('leaflet').CircleMarker | null = null;
  let pulseMarker: import('leaflet').CircleMarker | null = null;

  // Only true after invalidateSize() has run — guards the $effect from firing
  // before the map container has a valid pixel size (which causes NaN errors).
  let mounted = $state(false);

  onMount(async () => {
    const leaflet = await import('leaflet');
    L = (leaflet as any).default ?? leaflet;

    const center: LatLng = coord ?? TOKYO_CENTER;

    map = L.map(mapEl, {
      zoomControl:        false,
      attributionControl: false,
      scrollWheelZoom:    false,
      doubleClickZoom:    false,
      boxZoom:            false,
      keyboard:           false,
      dragging:           false,
      touchZoom:          false,
      tap:                false,
    }).setView(center, zoom);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    ).addTo(map);

    // Wait one frame for layout to settle, then fix the size and place the
    // initial marker. Only after this do we set mounted = true so the $effect
    // is allowed to call flyTo (which needs a valid container size).
    setTimeout(() => {
      if (!map || !L) return;
      map.invalidateSize();
      if (coord) placeMarker(coord, map);
      mounted = true;
    }, 120);
  });

  onDestroy(() => { map?.remove(); map = null; mounted = false; });

  // ── Animate to new coord whenever it changes ──────────────────────────────
  // Both `coord` and `mounted` are read unconditionally so Svelte tracks them
  // as dependencies. The effect will re-run when either changes.
  $effect(() => {
    const c = coord;       // track coord changes
    const ok = mounted;    // track readiness

    if (!ok || !map || !L || !c) return;

    map.stop();
    // setView with animate:true is more stable than flyTo on a locked map
    try {
      map.setView(c, zoom, { animate: true, duration: 0.6 } as any);
    } catch {
      map.setView(c, zoom, { animate: false });
    }
    placeMarker(c, map);
  });

  function placeMarker(latlng: LatLng, m: import('leaflet').Map) {
    if (!L) return;
    marker?.remove();
    pulseMarker?.remove();

    pulseMarker = L.circleMarker(latlng, {
      radius:      13,
      fillColor:   '#14b8a6',
      fillOpacity: 0.15,
      color:       '#14b8a6',
      weight:      1,
      opacity:     0.4,
    }).addTo(m);

    marker = L.circleMarker(latlng, {
      radius:      6,
      fillColor:   '#14b8a6',
      fillOpacity: 1,
      color:       'white',
      weight:      2,
    }).addTo(m);
  }
</script>

<div style="height: 100%; width: 100%; position: relative; pointer-events: none;">
  <div bind:this={mapEl} style="height: 100%; width: 100%;"></div>

  {#if label}
    <div
      style="
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255,255,255,0.92);
        border: 1px solid #e8e6e0;
        border-radius: 99px;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: 500;
        color: #2a2926;
        white-space: nowrap;
        pointer-events: none;
        backdrop-filter: blur(4px);
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      "
    >
      {label}
    </div>
  {/if}
</div>
