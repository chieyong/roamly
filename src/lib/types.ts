// ─── Core Domain Types ───────────────────────────────────────────────────────

export type Section = 'morning' | 'afternoon' | 'evening' | 'maybe';

export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string;
  coverEmoji?: string;
}

export interface Location {
  id: string;
  tripId: string;
  name: string;
  country: string;
  emoji: string;
  startDate: string;
  endDate: string;
  color: string; // tailwind bg class
}

export interface Day {
  id: string;
  tripId: string;
  locationId: string;
  date: string; // ISO date string e.g. "2024-04-15"
  label?: string; // optional override label
}

export interface Activity {
  id: string;
  dayId: string;
  section: Section;
  title: string;
  time?: string;        // e.g. "9:30 AM"
  notes?: string;
  location?: string;    // e.g. "Shibuya, Tokyo"
  order: number;
  emoji?: string;
  duration?: string;    // e.g. "2h"
}

// ─── AI Types ────────────────────────────────────────────────────────────────

export interface AISuggestion {
  title: string;
  notes: string;
  emoji: string;
  duration?: string;
}

export type AIMode = 'suggest' | 'optimize' | null;

/** Returned by enrichActivity() — inferred fields from a raw title string */
export interface ActivityEnrichment {
  emoji: string;
  location: string | null;
  time: string | null;
  duration: string | null;
  notes: string | null;
}
