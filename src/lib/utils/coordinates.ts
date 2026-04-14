// ─── Coordinate lookup for activity locations ─────────────────────────────────
// Covers all neighborhoods used in the Tokyo mock data, plus city-level
// coords for the home page overview map.

export type LatLng = [number, number]; // [lat, lng]

const COORDS: Record<string, LatLng> = {
  // ── Tokyo neighborhoods ────────────────────────────────────────────────────
  'Shinjuku':    [35.6938, 139.7034],
  'Harajuku':    [35.6702, 139.7027],
  'Shibuya':     [35.6580, 139.7016],
  'Ueno':        [35.7148, 139.7745],
  'Akihabara':   [35.7023, 139.7745],
  'Kanda':       [35.6938, 139.7706],
  'Toyosu':      [35.6473, 139.7967],
  'Tsukiji':     [35.6654, 139.7707],
  'Nakameguro':  [35.6440, 139.6988],
  'Odaiba':      [35.6267, 139.7750],
  'Ginza':       [35.6715, 139.7671],
  'Asakusa':     [35.7148, 139.7967],
  'Roppongi':    [35.6628, 139.7318],
  'Ikebukuro':   [35.7295, 139.7109],
  'Yanaka':      [35.7267, 139.7700],
  'Shimokitazawa': [35.6614, 139.6680],

  // ── City-level (home page / wider map) ────────────────────────────────────
  'Tokyo':       [35.6762, 139.6503],
  'Hakone':      [35.2329, 139.1069],
  'Kyoto':       [35.0116, 135.7681],
  'Osaka':       [34.6937, 135.5023],
  'Nara':        [34.6851, 135.8050],
  'Hiroshima':   [34.3853, 132.4553],
};

/** Returns [lat, lng] for a known location string, or null if not found. */
export function getCoord(location: string | undefined | null): LatLng | null {
  if (!location) return null;
  // exact match
  const base = COORDS[location]
    ?? COORDS[Object.keys(COORDS).find((k) => k.toLowerCase() === location.toLowerCase()) ?? ''];
  if (!base) return null;
  // Always return a NEW array so Svelte detects a change even when the
  // same location name is passed twice in a row (e.g. two Shibuya cards).
  return [base[0], base[1]];
}

/** Default centre to show when no activity has a known location yet. */
export const TOKYO_CENTER: LatLng = [35.6762, 139.6503];
