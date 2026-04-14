import { writable } from 'svelte/store';
import type { Section } from '$lib/types';

// Focus mode: show only current section
export const focusMode = writable(false);
export const focusSection = writable<Section>('morning');

// Active AI panel
export const aiPanelActivityId = writable<string | null>(null);

// Location currently shown on the mini-map (set by clicking an activity card)
export const mapFocusLocation = writable<string | null>(null);

// Accordion: only one activity card expanded at a time across all sections
export const expandedActivityId = writable<string | null>(null);

// Edit mode: only one activity card in edit mode at a time
export const editingActivityId = writable<string | null>(null);
