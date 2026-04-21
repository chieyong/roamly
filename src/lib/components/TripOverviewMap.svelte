<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Location } from '$lib/types';
  import { getCoord } from '$lib/utils/coordinates';

  let { locations }: { locations: Location[] } = $props();

  let mapEl: HTMLDivElement;
  let map: any = null;

  // Map location color class → hex
  const colorHex: Record<string, string> = {
    'bg-teal-100':   '#14b8a6',
    'bg-blue-100':   '#3b82f6',
    'bg-amber-100':  '#f59e0b',
    'bg-rose-100':   '#f43f5e',
    'bg-purple-100': '#a855f7',
    'bg-green-100':  '#22c55e',
  };

  function hex(loc: Location) {
    return colorHex[loc.color] ?? '#a09e98';
  }

  onMount(async () => {
    const leaflet = await import('leaflet');
    const L = (leaflet as any).default ?? leaflet;

    // Build a list of {loc, coord} pairs — skip unknown cities
    const points = locations
      .map((loc) => ({ loc, coord: getCoord(loc.name) }))
      .filter((p): p is { loc: Location; coord: [number, number] } => p.coord !== null);

    if (points.length === 0) return;

    // Use average center as initial view; fitBounds will correct it
    const avgLat = points.reduce((s, p) => s + p.coord[0], 0) / points.length;
    const avgLng = points.reduce((s, p) => s + p.coord[1], 0) / points.length;

    // Clear stale Leaflet state to avoid "already initialized" errors on re-mount.
    // Just deleting _leaflet_id is enough — the previous instance was already
    // cleaned up by onDestroy. Never call L.map(mapEl) here to "get" the old map,
    // because mapEl might be null/unbound during a fast navigation.
    if (mapEl && (mapEl as any)._leaflet_id != null) {
      delete (mapEl as any)._leaflet_id;
    }

    try {
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
    }).setView([avgLat, avgLng], 6);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    ).addTo(map);

    setTimeout(() => {
      if (!map || !L) return;
      try {
        map.invalidateSize();

        // Dashed route line
        L.polyline(
          points.map((p) => p.coord),
          { color: '#c4c1bb', weight: 1.5, opacity: 0.8, dashArray: '5, 8' }
        ).addTo(map);

        // Numbered city markers + labels
        points.forEach(({ loc, coord }, i) => {
          const color = hex(loc);

          // Numbered circle marker
          const icon = L.divIcon({
            html: `<div style="
              width:26px;height:26px;
              background:${color};
              border:2.5px solid white;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:11px;font-weight:700;color:white;
              box-shadow:0 2px 6px rgba(0,0,0,0.18);
              font-family:'Inter',sans-serif;
              line-height:1;
            ">${i + 1}</div>`,
            className: '',
            iconSize:   [26, 26],
            iconAnchor: [13, 13],
          });

          L.marker(coord, { icon }).addTo(map);

          // City name label (below marker)
          const label = L.divIcon({
            html: `<div style="
              font-size:10px;font-weight:600;
              color:${color};
              font-family:'Inter',sans-serif;
              white-space:nowrap;
              text-shadow:0 0 3px white, 0 0 3px white;
              margin-top:4px;
            ">${loc.emoji} ${loc.name}</div>`,
            className: '',
            iconSize:   [80, 18],
            iconAnchor: [-2, -6],
          });
          L.marker(coord, { icon: label }).addTo(map);
        });

        // Fit all markers with padding
        const bounds = L.latLngBounds(points.map((p) => p.coord));
        map.fitBounds(bounds, { padding: [28, 28] });
      } catch (err) {
        console.warn('[TripOverviewMap] render error:', err);
      }
    }, 150);
    } catch (err) {
      console.warn('[TripOverviewMap] init error:', err);
    }
  });

  onDestroy(() => { map?.remove(); map = null; });
</script>

<div style="height: 100%; width: 100%; position: relative; pointer-events: none;">
  <div bind:this={mapEl} style="height: 100%; width: 100%;"></div>
</div>
