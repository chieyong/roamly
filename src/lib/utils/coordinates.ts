// ─── Coordinate lookup for activity locations ─────────────────────────────────
// Covers specific POIs, neighborhoods, and city-level coordinates for Japan.
// POI entries take priority over neighborhood entries via exact-first matching.

export type LatLng = [number, number]; // [lat, lng]

const COORDS: Record<string, LatLng> = {
  // ── Tokyo: specific POIs ──────────────────────────────────────────────────
  'Shibuya Crossing':          [35.6595, 139.7004],
  'Shibuya 109':               [35.6591, 139.6988],
  'Senso-ji':                  [35.7147, 139.7966],
  'Senso-ji Temple':           [35.7147, 139.7966],
  'Asakusa Senso-ji':          [35.7147, 139.7966],
  'Sensoji':                   [35.7147, 139.7966],
  'Meiji Shrine':              [35.6763, 139.6993],
  'Meiji Jingu':               [35.6763, 139.6993],
  'Meiji Jingū':               [35.6763, 139.6993],
  'Shinjuku Gyoen':            [35.6851, 139.7100],
  'Tokyo Tower':               [35.6586, 139.7454],
  'Tokyo Skytree':             [35.7101, 139.8107],
  'Tsukiji Fish Market':       [35.6654, 139.7707],
  'Tsukiji Market':            [35.6654, 139.7707],
  'Toyosu Market':             [35.6474, 139.7849],
  'teamLab Planets':           [35.6388, 139.7957],
  'teamLab Borderless':        [35.6197, 139.7763],
  'teamLab':                   [35.6388, 139.7957],
  'Roppongi Hills':            [35.6605, 139.7292],
  'Mori Art Museum':           [35.6605, 139.7292],
  'Takeshita Street':          [35.6706, 139.7034],
  'Takeshita-dori':            [35.6706, 139.7034],
  'Nakameguro Canal':          [35.6440, 139.6988],
  'Golden Gai':                [35.6939, 139.7031],
  'Kabukicho':                 [35.6940, 139.7036],
  'Omoide Yokocho':            [35.6940, 139.6991],
  'Yanaka Ginza':              [35.7256, 139.7680],
  'Hamarikyu Gardens':         [35.6598, 139.7631],
  'Imperial Palace':           [35.6852, 139.7528],
  'Yoyogi Park':               [35.6715, 139.6949],
  'Akihabara Electric Town':   [35.7023, 139.7745],
  'Ueno Zoo':                  [35.7164, 139.7715],
  'Ueno Park':                 [35.7148, 139.7745],
  'Sumida Park':               [35.7109, 139.8045],
  'Tokyo DisneySea':           [35.6268, 139.8830],
  'Tokyo Disneyland':          [35.6329, 139.8804],
  'Odaiba Seaside Park':       [35.6267, 139.7750],

  // ── Tokyo: neighborhoods ──────────────────────────────────────────────────
  'Shinjuku':      [35.6938, 139.7034],
  'Harajuku':      [35.6702, 139.7027],
  'Shibuya':       [35.6580, 139.7016],
  'Ueno':          [35.7148, 139.7745],
  'Akihabara':     [35.7023, 139.7745],
  'Kanda':         [35.6938, 139.7706],
  'Toyosu':        [35.6473, 139.7967],
  'Tsukiji':       [35.6654, 139.7707],
  'Nakameguro':    [35.6440, 139.6988],
  'Odaiba':        [35.6267, 139.7750],
  'Ginza':         [35.6715, 139.7671],
  'Asakusa':       [35.7148, 139.7967],
  'Roppongi':      [35.6628, 139.7318],
  'Ikebukuro':     [35.7295, 139.7109],
  'Yanaka':        [35.7267, 139.7700],
  'Shimokitazawa': [35.6614, 139.6680],

  // ── Kyoto: specific POIs ──────────────────────────────────────────────────
  'Fushimi Inari':             [34.9671, 135.7727],
  'Fushimi Inari Taisha':      [34.9671, 135.7727],
  'Fushimi Inari Shrine':      [34.9671, 135.7727],
  'Arashiyama Bamboo Grove':   [35.0156, 135.6728],
  'Bamboo Grove':              [35.0156, 135.6728],
  'Bamboo Forest':             [35.0156, 135.6728],
  'Kinkaku-ji':                [35.0394, 135.7292],
  'Kinkakuji':                 [35.0394, 135.7292],
  'Golden Pavilion':           [35.0394, 135.7292],
  'Gion District':             [35.0036, 135.7757],
  'Gion':                      [35.0036, 135.7757],
  'Nishiki Market':            [35.0050, 135.7650],
  "Philosopher's Path":        [35.0268, 135.7949],
  'Tetsugaku-no-michi':        [35.0268, 135.7949],
  'Kiyomizu-dera':             [34.9948, 135.7851],
  'Kiyomizudera':              [34.9948, 135.7851],
  'Kiyomizu-dera Temple':      [34.9948, 135.7851],
  'Nijo Castle':               [35.0142, 135.7484],
  'Nijo-jo':                   [35.0142, 135.7484],
  'Tenryu-ji':                 [35.0149, 135.6728],
  'Tenryuji':                  [35.0149, 135.6728],
  'Ryoan-ji':                  [35.0343, 135.7184],
  'Ryoanji':                   [35.0343, 135.7184],
  'Arashiyama':                [35.0094, 135.6717],
  'Sagano':                    [35.0183, 135.6683],
  'Pontocho':                  [35.0050, 135.7690],
  'Fushimi':                   [34.9400, 135.7700],
  'Higashiyama':               [35.0030, 135.7780],

  // ── Osaka: specific POIs ─────────────────────────────────────────────────
  'Dotonbori':                 [34.6687, 135.5013],
  'Osaka Castle':              [34.6873, 135.5262],
  'Kuromon Market':            [34.6672, 135.5085],
  'Kuromon Ichiba':            [34.6672, 135.5085],
  'Shinsaibashi':              [34.6720, 135.5003],
  'Namba':                     [34.6687, 135.5013],
  'Den Den Town':              [34.6640, 135.5065],
  'Osaka Aquarium':            [34.6547, 135.4301],
  'Universal Studios Japan':   [34.6654, 135.4323],
  'USJ':                       [34.6654, 135.4323],

  // ── Nara: specific POIs ──────────────────────────────────────────────────
  'Nara Deer Park':            [34.6895, 135.8448],
  'Todai-ji':                  [34.6888, 135.8399],
  'Todaiji':                   [34.6888, 135.8399],
  'Todai-ji Temple':           [34.6888, 135.8399],
  'Kasuga Grand Shrine':       [34.6813, 135.8484],

  // ── Hiroshima & Miyajima: specific POIs ──────────────────────────────────
  'Peace Memorial Park':       [34.3955, 132.4536],
  'Hiroshima Peace Memorial':  [34.3955, 132.4536],
  'Atomic Bomb Dome':          [34.3955, 132.4536],
  'Genbaku Dome':              [34.3955, 132.4536],
  'Miyajima Island':           [34.2963, 132.3197],
  'Miyajima':                  [34.2963, 132.3197],
  'Itsukushima Shrine':        [34.2963, 132.3197],
  'Itsukushima':               [34.2963, 132.3197],

  // ── Hakone: specific POIs ────────────────────────────────────────────────
  'Hakone Open Air Museum':    [35.2416, 139.0584],
  'Lake Ashi':                 [35.2030, 139.0218],
  'Ashinoko':                  [35.2030, 139.0218],
  'Mount Fuji':                [35.3606, 138.7274],
  'Fuji-san':                  [35.3606, 138.7274],
  'Fuji':                      [35.3606, 138.7274],
  'Hakone Ropeway':            [35.2416, 139.0584],

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
  const loc = location.trim();

  // 1. Exact match (case-sensitive, fastest)
  let base = COORDS[loc];

  // 2. Case-insensitive exact match
  if (!base) {
    const lower = loc.toLowerCase();
    const key = Object.keys(COORDS).find((k) => k.toLowerCase() === lower);
    if (key) base = COORDS[key];
  }

  // 3. Fuzzy: find the longest COORDS key that is a substring of the location
  //    (e.g. "Senso-ji Temple Asakusa" → "Senso-ji Temple")
  if (!base) {
    const lower = loc.toLowerCase();
    let bestKey = '';
    for (const k of Object.keys(COORDS)) {
      if (lower.includes(k.toLowerCase()) && k.length > bestKey.length) {
        bestKey = k;
      }
    }
    if (bestKey) base = COORDS[bestKey];
  }

  if (!base) return null;
  // Always return a NEW array so Svelte detects a change even when the
  // same location name is passed twice in a row (e.g. two Shibuya cards).
  return [base[0], base[1]];
}

/** Default centre to show when no activity has a known location yet. */
export const TOKYO_CENTER: LatLng = [35.6762, 139.6503];
