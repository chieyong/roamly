import type { Section } from '$lib/types';

// ─── Duration parser ───────────────────────────────────────────────────────────
// Handles: "1.5h" "2h" "90m" "30m" "1h30m" "1h 30m" — falls back to 60 min

export function parseDuration(duration: string | undefined): number {
  if (!duration) return 60;
  const s = duration.toLowerCase().trim();

  // "1h30m" or "1h 30m"
  const hm = s.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(\d+)\s*m/);
  if (hm) return Math.round(parseFloat(hm[1]) * 60 + parseInt(hm[2]));

  // "1.5h" or "2h"
  const h = s.match(/^(\d+(?:\.\d+)?)\s*h/);
  if (h) return Math.round(parseFloat(h[1]) * 60);

  // "90m" or "30m"
  const m = s.match(/^(\d+)\s*m/);
  if (m) return parseInt(m[1]);

  return 60;
}

// ─── Time parser ───────────────────────────────────────────────────────────────
// "9:00 AM" → 540,  "1:30 PM" → 810,  "19:00" → 1140

export function parseTime(time: string | undefined): number | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const period = (match[3] ?? '').toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + mins;
}

// ─── Time formatter ────────────────────────────────────────────────────────────
// 540 → "9:00 AM",  810 → "1:30 PM",  480 → "8:00 AM"

export function formatTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  let hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(mins).padStart(2, '0')} ${period}`;
}

// ─── Section anchor times ──────────────────────────────────────────────────────
const ANCHORS: Record<Section, number> = {
  morning:   8  * 60,   // 8:00 AM
  afternoon: 13 * 60,   // 1:00 PM
  evening:   19 * 60,   // 7:00 PM
  maybe:     12 * 60,   // (unused, but typed)
};

// ─── Main helper ───────────────────────────────────────────────────────────────
// Returns the suggested start time for an activity based on its predecessor.

export function calcNextTime(
  prev: { time?: string; duration?: string } | undefined,
  section: Section
): string {
  const anchor = ANCHORS[section];

  if (!prev?.time) return formatTime(anchor);

  const start = parseTime(prev.time);
  if (start === null) return formatTime(anchor);

  return formatTime(start + parseDuration(prev.duration));
}
