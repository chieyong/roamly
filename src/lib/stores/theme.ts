import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// ── Fonts ─────────────────────────────────────────────────────────────────────

export interface FontOption {
  id:    string;
  name:  string;
  url:   string;   // Google Fonts query string (for the ?family= param)
  stack: string;   // CSS font-family value
}

export const fontOptions: FontOption[] = [
  { id: 'inter',         name: 'Inter',            url: 'Inter:wght@400;500;600;700',                    stack: "'Inter', system-ui, sans-serif" },
  { id: 'lato',          name: 'Lato',             url: 'Lato:wght@400;700',                             stack: "'Lato', system-ui, sans-serif" },
  { id: 'nunito',        name: 'Nunito',           url: 'Nunito:wght@400;500;600;700',                   stack: "'Nunito', system-ui, sans-serif" },
  { id: 'raleway',       name: 'Raleway',          url: 'Raleway:wght@400;500;600;700',                  stack: "'Raleway', system-ui, sans-serif" },
  { id: 'merri',         name: 'Merriweather',     url: 'Merriweather:wght@400;700',                     stack: "'Merriweather', Georgia, serif" },
  { id: 'playfair',      name: 'Playfair Display', url: 'Playfair+Display:ital,wght@0,400;0,600;1,400', stack: "'Playfair Display', Georgia, serif" },
  { id: 'special-elite', name: 'Special Elite',    url: 'Special+Elite',                                 stack: "'Special Elite', 'Courier New', monospace" },
];

// ── Theme presets ─────────────────────────────────────────────────────────────

export interface ThemePreset {
  id:           string;
  name:         string;
  tagline:      string;  // short description shown in settings
  // Backgrounds
  bg:           string;
  surface:      string;
  surfaceAlt:   string;
  // Borders
  border:       string;
  borderLight:  string;
  // Header
  headerBg:     string;
  // Text
  text:         string;
  textMuted:    string;
  textSubtle:   string;
  // Accent
  accent:       string;
  accentLight:  string;
  // Typography
  fontHeaderId: string;
  fontBodyId:   string;
}

export interface ThemePresetWithMode extends ThemePreset {
  darkId: string;
  isDark: boolean;
}

export const presets: ThemePresetWithMode[] = [

  // ── LICHT ──────────────────────────────────────────────────────────────────

  // 1. Zen — Warm Ivory (minimal, calm, default)
  {
    id: 'ivory', name: 'Zen', tagline: 'Minimaal & rustig', isDark: false, darkId: 'ivory-dark',
    bg: '#fafaf8', surface: '#ffffff', surfaceAlt: '#f4f3ef',
    border: '#e8e6e0', borderLight: '#f0eeea',
    headerBg: 'rgba(250,250,248,0.95)',
    text: '#1a1917', textMuted: '#a09e98', textSubtle: '#57564f',
    accent: '#0d9488', accentLight: '#f0fdfa',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },

  // 2. Trailblazer — energetic adventurer (burnt orange, Raleway bold)
  {
    id: 'trailblazer', name: 'Trailblazer', tagline: 'Actief & avontuurlijk', isDark: false, darkId: 'trailblazer-dark',
    bg: '#faf5f0', surface: '#ffffff', surfaceAlt: '#f0e8e0',
    border: '#ddc8b8', borderLight: '#ecddd3',
    headerBg: 'rgba(250,245,240,0.95)',
    text: '#1e1008', textMuted: '#9a7055', textSubtle: '#5c3018',
    accent: '#d94f1e', accentLight: '#feeee8',
    fontHeaderId: 'raleway', fontBodyId: 'lato',
  },

  // 3. Campus — bright student (vivid purple, Nunito rounded)
  {
    id: 'campus', name: 'Campus', tagline: 'Levendig & studentikoos', isDark: false, darkId: 'campus-dark',
    bg: '#f8f7ff', surface: '#ffffff', surfaceAlt: '#eeedff',
    border: '#ccc8f4', borderLight: '#dddaff',
    headerBg: 'rgba(248,247,255,0.95)',
    text: '#18163a', textMuted: '#7870aa', textSubtle: '#3c3870',
    accent: '#6d28d9', accentLight: '#ede9ff',
    fontHeaderId: 'nunito', fontBodyId: 'nunito',
  },

  // 4. Redacteur — journalistic typewriter (parchment, Special Elite)
  {
    id: 'reporter', name: 'Redacteur', tagline: 'Journalistiek & editorial', isDark: false, darkId: 'reporter-dark',
    bg: '#fdfaf0', surface: '#fffef7', surfaceAlt: '#f5f0dc',
    border: '#d8cc98', borderLight: '#e8e0c0',
    headerBg: 'rgba(253,250,240,0.96)',
    text: '#1a1400', textMuted: '#80703a', textSubtle: '#4a3c10',
    accent: '#8b5c00', accentLight: '#fdf5d0',
    fontHeaderId: 'special-elite', fontBodyId: 'lato',
  },

  // 5. Ontdekkingsreiziger — luxury explorer (gold, Playfair serif)
  {
    id: 'discovery', name: 'Ontdekkingsreiziger', tagline: 'Elegant & verfijnd', isDark: false, darkId: 'discovery-dark',
    bg: '#fdfcf6', surface: '#fffefb', surfaceAlt: '#f5f0e0',
    border: '#d8c890', borderLight: '#e8e0c0',
    headerBg: 'rgba(253,252,246,0.96)',
    text: '#1a1200', textMuted: '#9a8850', textSubtle: '#5a4820',
    accent: '#a87800', accentLight: '#fdf5d8',
    fontHeaderId: 'playfair', fontBodyId: 'merri',
  },

  // ── DONKER ─────────────────────────────────────────────────────────────────

  // 1. Zen Dark
  {
    id: 'ivory-dark', name: 'Zen', tagline: 'Minimaal & rustig', isDark: true, darkId: 'ivory',
    bg: '#1a1917', surface: '#242220', surfaceAlt: '#2e2c29',
    border: '#3a3835', borderLight: '#2e2c29',
    headerBg: 'rgba(26,25,23,0.95)',
    text: '#f0eeea', textMuted: '#7d7b75', textSubtle: '#b0ada7',
    accent: '#14b8a6', accentLight: '#0d2e2b',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },

  // 2. Trailblazer Dark — night hike, warm orange glow
  {
    id: 'trailblazer-dark', name: 'Trailblazer', tagline: 'Actief & avontuurlijk', isDark: true, darkId: 'trailblazer',
    bg: '#1a0e06', surface: '#241408', surfaceAlt: '#301c0e',
    border: '#4e2e16', borderLight: '#3c2010',
    headerBg: 'rgba(26,14,6,0.95)',
    text: '#f5e0cc', textMuted: '#806040', textSubtle: '#c09070',
    accent: '#ff7040', accentLight: '#3d1206',
    fontHeaderId: 'raleway', fontBodyId: 'lato',
  },

  // 3. Campus Dark — deep violet night
  {
    id: 'campus-dark', name: 'Campus', tagline: 'Levendig & studentikoos', isDark: true, darkId: 'campus',
    bg: '#0e0c1e', surface: '#16122c', surfaceAlt: '#1e1840',
    border: '#302870', borderLight: '#241e58',
    headerBg: 'rgba(14,12,30,0.95)',
    text: '#e8e0ff', textMuted: '#6860a0', textSubtle: '#a898e0',
    accent: '#a78bfa', accentLight: '#1e1050',
    fontHeaderId: 'nunito', fontBodyId: 'nunito',
  },

  // 4. Redacteur Dark — ink & old newsprint
  {
    id: 'reporter-dark', name: 'Redacteur', tagline: 'Journalistiek & editorial', isDark: true, darkId: 'reporter',
    bg: '#181400', surface: '#221c04', surfaceAlt: '#2c2408',
    border: '#4a4010', borderLight: '#3a3008',
    headerBg: 'rgba(24,20,0,0.96)',
    text: '#f0e8b8', textMuted: '#806840', textSubtle: '#b09860',
    accent: '#d4a830', accentLight: '#2e2000',
    fontHeaderId: 'special-elite', fontBodyId: 'lato',
  },

  // 5. Ontdekkingsreiziger Dark — moody luxury
  {
    id: 'discovery-dark', name: 'Ontdekkingsreiziger', tagline: 'Elegant & verfijnd', isDark: true, darkId: 'discovery',
    bg: '#120e00', surface: '#1c1800', surfaceAlt: '#282200',
    border: '#483800', borderLight: '#342800',
    headerBg: 'rgba(18,14,0,0.96)',
    text: '#f8f0d0', textMuted: '#8a7840', textSubtle: '#c0a858',
    accent: '#e8c030', accentLight: '#2c2000',
    fontHeaderId: 'playfair', fontBodyId: 'merri',
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'roamly-theme-v3';

function getInitialTheme(): ThemePreset {
  if (!browser) return presets[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<ThemePreset>;
      // Try to find the saved preset by ID for clean migration
      const match = presets.find(p => p.id === saved.id);
      if (match) return match;
      // Merge saved with default so new fields always exist
      return { ...presets[0], ...saved };
    }
  } catch { /* ignore */ }
  return presets[0];
}

export const currentTheme = writable<ThemePreset>(getInitialTheme());

// ── Apply theme ───────────────────────────────────────────────────────────────

function applyTheme(t: ThemePreset) {
  if (!browser) return;

  // Persist
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));

  // Color CSS vars
  const r = document.documentElement.style;
  r.setProperty('--clr-bg',           t.bg);
  r.setProperty('--clr-surface',      t.surface);
  r.setProperty('--clr-surface-alt',  t.surfaceAlt);
  r.setProperty('--clr-border',       t.border);
  r.setProperty('--clr-border-light', t.borderLight);
  r.setProperty('--clr-header-bg',    t.headerBg);
  r.setProperty('--clr-text',         t.text);
  r.setProperty('--clr-muted',        t.textMuted);
  r.setProperty('--clr-subtle',       t.textSubtle);
  r.setProperty('--clr-accent',       t.accent);
  r.setProperty('--clr-accent-light', t.accentLight);

  // Font CSS vars
  const hFont = fontOptions.find(f => f.id === t.fontHeaderId) ?? fontOptions[0];
  const bFont = fontOptions.find(f => f.id === t.fontBodyId)   ?? fontOptions[0];
  r.setProperty('--font-header', hFont.stack);
  r.setProperty('--font-body',   bFont.stack);

  // Load needed Google Fonts dynamically
  const needed = [...new Set([t.fontHeaderId, t.fontBodyId])];
  const urls = needed
    .map(id => fontOptions.find(f => f.id === id)?.url)
    .filter(Boolean)
    .join('&family=');

  let link = document.getElementById('roamly-gfonts') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = 'roamly-gfonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?family=${urls}&display=swap`;
}

currentTheme.subscribe(applyTheme);
