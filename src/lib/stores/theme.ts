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
  { id: 'inter',    name: 'Inter',            url: 'Inter:wght@400;500;600;700',                    stack: "'Inter', system-ui, sans-serif" },
  { id: 'lato',     name: 'Lato',             url: 'Lato:wght@400;700',                             stack: "'Lato', system-ui, sans-serif" },
  { id: 'raleway',  name: 'Raleway',          url: 'Raleway:wght@400;500;600;700',                  stack: "'Raleway', system-ui, sans-serif" },
  { id: 'merri',    name: 'Merriweather',     url: 'Merriweather:wght@400;700',                     stack: "'Merriweather', Georgia, serif" },
  { id: 'playfair', name: 'Playfair Display', url: 'Playfair+Display:ital,wght@0,400;0,600;1,400', stack: "'Playfair Display', Georgia, serif" },
];

// ── Theme presets ─────────────────────────────────────────────────────────────

export interface ThemePreset {
  id:           string;
  name:         string;
  // Backgrounds
  bg:           string;  // page background
  surface:      string;  // card / block / modal background
  surfaceAlt:   string;  // subtle backgrounds, inputs
  // Borders
  border:       string;  // main borders
  borderLight:  string;  // very subtle dividers
  // Header
  headerBg:     string;  // sticky header background (supports rgba)
  // Text
  text:         string;  // primary text
  textMuted:    string;  // secondary / label text
  textSubtle:   string;  // body text
  // Accent
  accent:       string;  // brand / CTA color
  accentLight:  string;  // tint background for accent elements
  // Typography
  fontHeaderId: string;  // key from fontOptions
  fontBodyId:   string;  // key from fontOptions
}

export const presets: ThemePreset[] = [
  {
    id: 'ivory', name: 'Warm Ivory',
    bg: '#fafaf8', surface: '#ffffff', surfaceAlt: '#f4f3ef',
    border: '#e8e6e0', borderLight: '#f0eeea',
    headerBg: 'rgba(250,250,248,0.92)',
    text: '#1a1917', textMuted: '#a09e98', textSubtle: '#57564f',
    accent: '#0d9488', accentLight: '#f0fdfa',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },
  {
    id: 'white', name: 'Clean White',
    bg: '#ffffff', surface: '#f8f9fa', surfaceAlt: '#f1f3f5',
    border: '#dee2e6', borderLight: '#e9ecef',
    headerBg: 'rgba(255,255,255,0.92)',
    text: '#212529', textMuted: '#868e96', textSubtle: '#495057',
    accent: '#0d9488', accentLight: '#e6faf8',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },
  {
    id: 'slate', name: 'Cool Slate',
    bg: '#f0f4f8', surface: '#ffffff', surfaceAlt: '#e2eaf2',
    border: '#c5d3e0', borderLight: '#dae4ed',
    headerBg: 'rgba(240,244,248,0.92)',
    text: '#1e293b', textMuted: '#64748b', textSubtle: '#334155',
    accent: '#3b82f6', accentLight: '#eff6ff',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },
  {
    id: 'sage', name: 'Sage Green',
    bg: '#f2f7f2', surface: '#ffffff', surfaceAlt: '#e8f0e8',
    border: '#c4d4c4', borderLight: '#d8e8d8',
    headerBg: 'rgba(242,247,242,0.92)',
    text: '#1a2b1a', textMuted: '#6b8f6b', textSubtle: '#3d5c3d',
    accent: '#16a34a', accentLight: '#f0fdf4',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },
  {
    id: 'midnight', name: 'Midnight',
    bg: '#0f1117', surface: '#1a1d27', surfaceAlt: '#242836',
    border: '#2d3348', borderLight: '#353c54',
    headerBg: 'rgba(15,17,23,0.92)',
    text: '#e8e9ed', textMuted: '#7b7f96', textSubtle: '#a8aabf',
    accent: '#7c3aed', accentLight: '#2d1f4a',
    fontHeaderId: 'inter', fontBodyId: 'inter',
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'roamly-theme-v2';

function getInitialTheme(): ThemePreset {
  if (!browser) return presets[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<ThemePreset>;
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
