import type { Trip, Location, Day, Activity } from '$lib/types';

// ─── Trip ─────────────────────────────────────────────────────────────────────

export const mockTrip: Trip = {
  id: 'trip-japan-2024',
  name: 'Japan Spring ✨',
  startDate: '2024-04-10',
  endDate: '2024-04-24',
  coverEmoji: '🌸'
};

// ─── Locations ────────────────────────────────────────────────────────────────

export const mockLocations: Location[] = [
  {
    id: 'loc-tokyo',
    tripId: 'trip-japan-2024',
    name: 'Tokyo',
    country: 'Japan',
    emoji: '🗼',
    startDate: '2024-04-10',
    endDate: '2024-04-15',
    color: 'bg-teal-100'
  },
  {
    id: 'loc-hakone',
    tripId: 'trip-japan-2024',
    name: 'Hakone',
    country: 'Japan',
    emoji: '🗻',
    startDate: '2024-04-15',
    endDate: '2024-04-17',
    color: 'bg-blue-100'
  },
  {
    id: 'loc-kyoto',
    tripId: 'trip-japan-2024',
    name: 'Kyoto',
    country: 'Japan',
    emoji: '⛩️',
    startDate: '2024-04-17',
    endDate: '2024-04-22',
    color: 'bg-amber-100'
  },
  {
    id: 'loc-osaka',
    tripId: 'trip-japan-2024',
    name: 'Osaka',
    country: 'Japan',
    emoji: '🏯',
    startDate: '2024-04-22',
    endDate: '2024-04-24',
    color: 'bg-rose-100'
  }
];

// ─── Days ─────────────────────────────────────────────────────────────────────

export const mockDays: Day[] = [
  { id: 'day-1', tripId: 'trip-japan-2024', locationId: 'loc-tokyo', date: '2024-04-10' },
  { id: 'day-2', tripId: 'trip-japan-2024', locationId: 'loc-tokyo', date: '2024-04-11' },
  { id: 'day-3', tripId: 'trip-japan-2024', locationId: 'loc-tokyo', date: '2024-04-12' },
  { id: 'day-4', tripId: 'trip-japan-2024', locationId: 'loc-tokyo', date: '2024-04-13' },
  { id: 'day-5', tripId: 'trip-japan-2024', locationId: 'loc-tokyo', date: '2024-04-14' },
  { id: 'day-6', tripId: 'trip-japan-2024', locationId: 'loc-hakone', date: '2024-04-15' },
  { id: 'day-7', tripId: 'trip-japan-2024', locationId: 'loc-hakone', date: '2024-04-16' },
  { id: 'day-8', tripId: 'trip-japan-2024', locationId: 'loc-kyoto', date: '2024-04-17' },
  { id: 'day-9', tripId: 'trip-japan-2024', locationId: 'loc-kyoto', date: '2024-04-18' },
  { id: 'day-10', tripId: 'trip-japan-2024', locationId: 'loc-kyoto', date: '2024-04-19' },
  { id: 'day-11', tripId: 'trip-japan-2024', locationId: 'loc-kyoto', date: '2024-04-20' },
  { id: 'day-12', tripId: 'trip-japan-2024', locationId: 'loc-kyoto', date: '2024-04-21' },
  { id: 'day-13', tripId: 'trip-japan-2024', locationId: 'loc-osaka', date: '2024-04-22' },
  { id: 'day-14', tripId: 'trip-japan-2024', locationId: 'loc-osaka', date: '2024-04-23' },
];

// ─── Activities ───────────────────────────────────────────────────────────────

export const mockActivities: Activity[] = [
  // Day 1 - Tokyo arrival
  { id: 'act-1', dayId: 'day-1', section: 'afternoon', title: 'Check in at hotel', time: '3:00 PM', notes: 'Gracery Shinjuku – confirm early check-in', location: 'Shinjuku', order: 0, emoji: '🏨' },
  { id: 'act-2', dayId: 'day-1', section: 'afternoon', title: 'Explore Shinjuku streets', time: '5:00 PM', notes: 'Golden Gai area, Kabukicho lanterns', location: 'Shinjuku', order: 1, emoji: '🚶' },
  { id: 'act-3', dayId: 'day-1', section: 'evening', title: 'Ramen dinner at Fuunji', time: '7:30 PM', notes: 'Tsukemen-style, expect a short queue', location: 'Shinjuku', order: 0, emoji: '🍜', duration: '1h' },

  // Day 2 - Shibuya / Harajuku
  { id: 'act-4', dayId: 'day-2', section: 'morning', title: 'Meiji Shrine', time: '8:00 AM', notes: 'Arrive early to avoid crowds', location: 'Harajuku', order: 0, emoji: '⛩️', duration: '1.5h' },
  { id: 'act-5', dayId: 'day-2', section: 'morning', title: 'Takeshita Street', time: '10:00 AM', notes: 'Crepe shops, vintage stores', location: 'Harajuku', order: 1, emoji: '🛍️', duration: '1h' },
  { id: 'act-6', dayId: 'day-2', section: 'afternoon', title: 'Shibuya Sky observation deck', time: '1:00 PM', notes: 'Book tickets in advance! Best views of the crossing', location: 'Shibuya', order: 0, emoji: '🌆', duration: '1.5h' },
  { id: 'act-7', dayId: 'day-2', section: 'afternoon', title: 'Shibuya Crossing', time: '3:00 PM', notes: 'Go at rush hour for the full experience', location: 'Shibuya', order: 1, emoji: '🚦', duration: '30m' },
  { id: 'act-8', dayId: 'day-2', section: 'evening', title: 'Drinks at Nonbei Yokocho', time: '7:00 PM', notes: '"Remembrance Lane" – tiny atmospheric bars', location: 'Shibuya', order: 0, emoji: '🍻', duration: '2h' },

  // Day 3 - Akihabara / Ueno
  { id: 'act-9', dayId: 'day-3', section: 'morning', title: 'Ueno Park', time: '9:00 AM', notes: 'Cherry blossoms (if still blooming)', location: 'Ueno', order: 0, emoji: '🌸', duration: '1.5h' },
  { id: 'act-10', dayId: 'day-3', section: 'morning', title: 'Tokyo National Museum', time: '11:00 AM', notes: 'Japanese art and history', location: 'Ueno', order: 1, emoji: '🏛️', duration: '2h' },
  { id: 'act-11', dayId: 'day-3', section: 'afternoon', title: 'Akihabara electronics district', time: '2:00 PM', notes: 'Yodobashi Camera, arcades, anime shops', location: 'Akihabara', order: 0, emoji: '🎮', duration: '2h' },
  { id: 'act-12', dayId: 'day-3', section: 'evening', title: 'Dinner at Kanda Yabu Soba', time: '6:30 PM', notes: 'Historic soba restaurant, been around since 1880', location: 'Kanda', order: 0, emoji: '🍝', duration: '1h' },

  // Maybe list
  { id: 'act-13', dayId: 'maybe', section: 'maybe', title: 'teamLab Planets', notes: 'Digital art museum in Toyosu – book ahead', location: 'Toyosu', order: 0, emoji: '🎨' },
  { id: 'act-14', dayId: 'maybe', section: 'maybe', title: 'Tsukiji Outer Market', notes: 'Best breakfast in Tokyo – fresh tuna, tamagoyaki', location: 'Tsukiji', order: 1, emoji: '🐟' },
  { id: 'act-15', dayId: 'maybe', section: 'maybe', title: 'Nakameguro Canal Walk', notes: 'Especially beautiful with cherry blossoms', location: 'Nakameguro', order: 2, emoji: '🌊' },
  { id: 'act-16', dayId: 'maybe', section: 'maybe', title: 'Odaiba – Gundam Statue', notes: 'Giant robot! Worth the detour', location: 'Odaiba', order: 3, emoji: '🤖' },
];
