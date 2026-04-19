import type { Trip, Location, Day, Activity } from '$lib/types';

// ─── Trip ─────────────────────────────────────────────────────────────────────

export const mockTrip: Trip = {
  id: 'trip-japan-2024',
  name: 'Japan Spring 2026',
  startDate: '2026-04-10',
  endDate: '2026-04-24',
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
    startDate: '2026-04-10',
    endDate: '2026-04-15',
    color: 'bg-teal-100'
  },
  {
    id: 'loc-hakone',
    tripId: 'trip-japan-2024',
    name: 'Hakone',
    country: 'Japan',
    emoji: '🗻',
    startDate: '2026-04-15',
    endDate: '2026-04-17',
    color: 'bg-blue-100'
  },
  {
    id: 'loc-kyoto',
    tripId: 'trip-japan-2024',
    name: 'Kyoto',
    country: 'Japan',
    emoji: '⛩️',
    startDate: '2026-04-17',
    endDate: '2026-04-22',
    color: 'bg-amber-100'
  },
  {
    id: 'loc-osaka',
    tripId: 'trip-japan-2024',
    name: 'Osaka',
    country: 'Japan',
    emoji: '🏯',
    startDate: '2026-04-22',
    endDate: '2026-04-24',
    color: 'bg-rose-100'
  }
];

// ─── Days ─────────────────────────────────────────────────────────────────────

export const mockDays: Day[] = [
  { id: 'day-1',  tripId: 'trip-japan-2024', locationId: 'loc-tokyo',  date: '2026-04-10' },
  { id: 'day-2',  tripId: 'trip-japan-2024', locationId: 'loc-tokyo',  date: '2026-04-11' },
  { id: 'day-3',  tripId: 'trip-japan-2024', locationId: 'loc-tokyo',  date: '2026-04-12' },
  { id: 'day-4',  tripId: 'trip-japan-2024', locationId: 'loc-tokyo',  date: '2026-04-13' },
  { id: 'day-5',  tripId: 'trip-japan-2024', locationId: 'loc-tokyo',  date: '2026-04-14' },
  { id: 'day-6',  tripId: 'trip-japan-2024', locationId: 'loc-hakone', date: '2026-04-15', departureLocationId: 'loc-tokyo' },
  { id: 'day-7',  tripId: 'trip-japan-2024', locationId: 'loc-hakone', date: '2026-04-16' },
  { id: 'day-8',  tripId: 'trip-japan-2024', locationId: 'loc-kyoto',  date: '2026-04-17', departureLocationId: 'loc-hakone' },
  { id: 'day-9',  tripId: 'trip-japan-2024', locationId: 'loc-kyoto',  date: '2026-04-18' },
  { id: 'day-10', tripId: 'trip-japan-2024', locationId: 'loc-kyoto',  date: '2026-04-19' },
  { id: 'day-11', tripId: 'trip-japan-2024', locationId: 'loc-kyoto',  date: '2026-04-20' },
  { id: 'day-12', tripId: 'trip-japan-2024', locationId: 'loc-kyoto',  date: '2026-04-21' },
  { id: 'day-13', tripId: 'trip-japan-2024', locationId: 'loc-osaka',  date: '2026-04-22', departureLocationId: 'loc-kyoto' },
  { id: 'day-14', tripId: 'trip-japan-2024', locationId: 'loc-osaka',  date: '2026-04-23' },
];

// ─── Activities ───────────────────────────────────────────────────────────────

export const mockActivities: Activity[] = [
  // Day 1 - Tokyo arrival
  { id: 'act-1',  dayId: 'day-1', section: 'afternoon', title: 'Check in at hotel',        time: '3:00 PM',  notes: 'Gracery Shinjuku – confirm early check-in',           location: 'Shinjuku',    order: 0, emoji: '🏨' },
  { id: 'act-2',  dayId: 'day-1', section: 'afternoon', title: 'Explore Shinjuku streets', time: '5:00 PM',  notes: 'Golden Gai area, Kabukicho lanterns',                 location: 'Shinjuku',    order: 1, emoji: '🚶' },
  { id: 'act-3',  dayId: 'day-1', section: 'evening',   title: 'Ramen dinner at Fuunji',   time: '7:30 PM',  notes: 'Tsukemen-style, expect a short queue',                location: 'Shinjuku',    order: 0, emoji: '🍜', duration: '1h' },

  // Day 2 - Shibuya / Harajuku
  { id: 'act-4',  dayId: 'day-2', section: 'morning',   title: 'Meiji Shrine',             time: '8:00 AM',  notes: 'Arrive early to avoid crowds',                        location: 'Harajuku',    order: 0, emoji: '⛩️', duration: '1.5h' },
  { id: 'act-5',  dayId: 'day-2', section: 'morning',   title: 'Takeshita Street',         time: '10:00 AM', notes: 'Crepe shops, vintage stores',                         location: 'Harajuku',    order: 1, emoji: '🛍️', duration: '1h' },
  { id: 'act-6',  dayId: 'day-2', section: 'afternoon', title: 'Shibuya Sky observation',  time: '1:00 PM',  notes: 'Book tickets in advance! Best views of the crossing', location: 'Shibuya',     order: 0, emoji: '🌆', duration: '1.5h' },
  { id: 'act-7',  dayId: 'day-2', section: 'afternoon', title: 'Shibuya Crossing',         time: '3:00 PM',  notes: 'Go at rush hour for the full experience',             location: 'Shibuya',     order: 1, emoji: '🚦', duration: '30m' },
  { id: 'act-8',  dayId: 'day-2', section: 'evening',   title: 'Drinks at Nonbei Yokocho', time: '7:00 PM',  notes: '"Remembrance Lane" – tiny atmospheric bars',          location: 'Shibuya',     order: 0, emoji: '🍻', duration: '2h' },

  // Day 3 - Akihabara / Ueno
  { id: 'act-9',  dayId: 'day-3', section: 'morning',   title: 'Ueno Park',                time: '9:00 AM',  notes: 'Cherry blossoms (if still blooming)',                 location: 'Ueno',        order: 0, emoji: '🌸', duration: '1.5h' },
  { id: 'act-10', dayId: 'day-3', section: 'morning',   title: 'Tokyo National Museum',    time: '11:00 AM', notes: 'Japanese art and history',                            location: 'Ueno',        order: 1, emoji: '🏛️', duration: '2h' },
  { id: 'act-11', dayId: 'day-3', section: 'afternoon', title: 'Akihabara electronics',    time: '2:00 PM',  notes: 'Yodobashi Camera, arcades, anime shops',              location: 'Akihabara',   order: 0, emoji: '🎮', duration: '2h' },
  { id: 'act-12', dayId: 'day-3', section: 'evening',   title: 'Kanda Yabu Soba',          time: '6:30 PM',  notes: 'Historic soba restaurant, since 1880',                location: 'Kanda',       order: 0, emoji: '🍝', duration: '1h' },

  // Day 4 - Tokyo (more)
  { id: 'act-16', dayId: 'day-4', section: 'morning',   title: 'Senso-ji Temple',          time: '8:30 AM',  notes: 'Arrive early for fewer crowds, Nakamise shopping street', location: 'Asakusa',     order: 0, emoji: '🏮', duration: '1.5h' },
  { id: 'act-17', dayId: 'day-4', section: 'morning',   title: 'Asakusa riverside walk',   time: '10:30 AM', notes: 'Sumida River views, Tokyo Skytree backdrop',              location: 'Asakusa',     order: 1, emoji: '🌉', duration: '1h' },
  { id: 'act-18', dayId: 'day-4', section: 'afternoon', title: 'teamLab Planets',          time: '2:00 PM',  notes: 'Book tickets well in advance! Digital art immersion',     location: 'Toyosu',      order: 0, emoji: '🎨', duration: '2h' },
  { id: 'act-19', dayId: 'day-4', section: 'evening',   title: 'Izakaya dinner Yurakucho', time: '7:00 PM',  notes: 'Under the train tracks – atmospheric spot',              location: 'Yurakucho',   order: 0, emoji: '🍢', duration: '2h' },

  // Day 5 - Tokyo last day
  { id: 'act-20', dayId: 'day-5', section: 'morning',   title: 'Tsukiji Outer Market',     time: '7:30 AM',  notes: 'Fresh tuna, tamagoyaki, best breakfast in Tokyo',        location: 'Tsukiji',     order: 0, emoji: '🐟', duration: '1.5h' },
  { id: 'act-21', dayId: 'day-5', section: 'afternoon', title: 'Nakameguro Canal Walk',    time: '1:00 PM',  notes: 'Cherry blossom-lined canal, boutique cafés',             location: 'Nakameguro',  order: 0, emoji: '🌸', duration: '1.5h' },
  { id: 'act-22', dayId: 'day-5', section: 'afternoon', title: 'Daikanyama T-Site',        time: '3:00 PM',  notes: 'Beautiful bookshop & design complex',                    location: 'Daikanyama',  order: 1, emoji: '📚', duration: '1h' },
  { id: 'act-23', dayId: 'day-5', section: 'evening',   title: 'Farewell sushi – Sushi Saito prep', time: '7:00 PM', notes: 'Find a great omakase counter in Ginza',          location: 'Ginza',       order: 0, emoji: '🍣', duration: '2h' },

  // Day 6 - Hakone arrival
  { id: 'act-24', dayId: 'day-6', section: 'morning',   title: 'Romancecar to Hakone',     time: '9:00 AM',  notes: 'Scenic limited express from Shinjuku, ~85 min',          location: 'Shinjuku',    order: 0, emoji: '🚄', duration: '1.5h' },
  { id: 'act-25', dayId: 'day-6', section: 'afternoon', title: 'Hakone Open Air Museum',   time: '12:00 PM', notes: 'Sculptures in nature, Picasso pavilion, great views',    location: 'Chokoku no Mori', order: 0, emoji: '🗿', duration: '2.5h' },
  { id: 'act-26', dayId: 'day-6', section: 'afternoon', title: 'Check in Ryokan',          time: '3:00 PM',  notes: 'Hakone Ginyu or similar – onsen bath before dinner',     location: 'Gora',        order: 1, emoji: '🏨', duration: '1h' },
  { id: 'act-27', dayId: 'day-6', section: 'evening',   title: 'Kaiseki dinner at ryokan', time: '6:30 PM',  notes: 'Multi-course Japanese dinner included with stay',        location: 'Gora',        order: 0, emoji: '🍱', duration: '2h' },

  // Day 7 - Hakone exploration
  { id: 'act-28', dayId: 'day-7', section: 'morning',   title: 'Morning onsen',            time: '7:00 AM',  notes: 'Outdoor hot spring bath with Mt. Fuji views (if clear!)', location: 'Gora',       order: 0, emoji: '♨️', duration: '1h' },
  { id: 'act-29', dayId: 'day-7', section: 'morning',   title: 'Hakone Ropeway',           time: '9:30 AM',  notes: 'Cable car over volcanic terrain, stunning Fuji views',   location: 'Sounzan',     order: 0, emoji: '🚡', duration: '1.5h' },
  { id: 'act-30', dayId: 'day-7', section: 'morning',   title: 'Lake Ashi cruise',         time: '11:30 AM', notes: 'Pirate ship cruise on Hakone Lake',                      location: 'Togendai',    order: 1, emoji: '⛵', duration: '1h' },
  { id: 'act-31', dayId: 'day-7', section: 'afternoon', title: 'Hakone Shrine',            time: '1:30 PM',  notes: 'Torii gate right at the lake\'s edge',                   location: 'Hakone-machi',order: 0, emoji: '⛩️', duration: '1h' },
  { id: 'act-32', dayId: 'day-7', section: 'afternoon', title: 'Pack & evening train',     time: '4:00 PM',  notes: 'Head to Odawara for shinkansen to Kyoto (2.5h)',         location: 'Odawara',     order: 1, emoji: '🚅', duration: '1h' },

  // Day 8 - Kyoto arrival
  { id: 'act-33', dayId: 'day-8', section: 'morning',   title: 'Arrive Kyoto',             time: '10:00 AM', notes: 'Check in near Gion – drop bags, grab a coffee',          location: 'Kyoto Station', order: 0, emoji: '🏨', duration: '1h' },
  { id: 'act-34', dayId: 'day-8', section: 'afternoon', title: 'Fushimi Inari Taisha',     time: '12:30 PM', notes: 'Walk the thousand torii gates – go past the crowds!',    location: 'Fushimi',     order: 0, emoji: '⛩️', duration: '3h' },
  { id: 'act-35', dayId: 'day-8', section: 'evening',   title: 'Dinner in Gion',           time: '7:00 PM',  notes: 'Stroll Hanamikoji Street, spot geisha in the evening',   location: 'Gion',        order: 0, emoji: '🏮', duration: '2h' },

  // Day 9 - Kyoto temples
  { id: 'act-36', dayId: 'day-9', section: 'morning',   title: 'Arashiyama Bamboo Grove',  time: '7:30 AM',  notes: 'Go at sunrise – magical light and no crowds yet',        location: 'Arashiyama',  order: 0, emoji: '🎋', duration: '1h' },
  { id: 'act-37', dayId: 'day-9', section: 'morning',   title: 'Tenryu-ji Garden',         time: '9:00 AM',  notes: 'UNESCO garden with pond and mountain backdrop',          location: 'Arashiyama',  order: 1, emoji: '🌿', duration: '1.5h' },
  { id: 'act-38', dayId: 'day-9', section: 'morning',   title: 'Okochi Sanso Villa',       time: '11:00 AM', notes: 'Hidden gem – hilltop garden with city panorama',         location: 'Arashiyama',  order: 2, emoji: '🏡', duration: '1h' },
  { id: 'act-39', dayId: 'day-9', section: 'afternoon', title: 'Kinkaku-ji (Golden Pavilion)', time: '2:00 PM', notes: 'Go mid-afternoon when tour groups thin out',          location: 'Kinkaku-ji',  order: 0, emoji: '✨', duration: '1h' },
  { id: 'act-40', dayId: 'day-9', section: 'evening',   title: 'Nishiki Market',           time: '5:30 PM',  notes: '"Kyoto\'s Kitchen" – street food, pickles, tofu',        location: 'Nishiki',     order: 0, emoji: '🥢', duration: '1.5h' },

  // Day 10 - Kyoto day
  { id: 'act-41', dayId: 'day-10', section: 'morning',   title: 'Philosopher\'s Path',     time: '8:00 AM',  notes: 'Canal walk lined with cherry trees, very peaceful',      location: 'Higashiyama', order: 0, emoji: '🌸', duration: '1.5h' },
  { id: 'act-42', dayId: 'day-10', section: 'morning',   title: 'Nanzen-ji Temple',        time: '10:00 AM', notes: 'Huge sanmon gate, aqueduct, serene subtemples',          location: 'Okazaki',     order: 1, emoji: '🏯', duration: '1.5h' },
  { id: 'act-43', dayId: 'day-10', section: 'afternoon', title: 'Gion Shijo area',         time: '1:30 PM',  notes: 'Shopping, matcha tasting, Yasaka Shrine',               location: 'Gion',        order: 0, emoji: '🍵', duration: '2h' },
  { id: 'act-44', dayId: 'day-10', section: 'evening',   title: 'Pontocho alley dinner',   time: '7:00 PM',  notes: 'Narrow lantern-lit alley of restaurants along the river', location: 'Pontocho',  order: 0, emoji: '🍶', duration: '2h' },

  // Day 11 - Kyoto / Nara day trip
  { id: 'act-45', dayId: 'day-11', section: 'morning',   title: 'Day trip to Nara',        time: '8:30 AM',  notes: '45-min train from Kintetsu-Kyoto – deer park, Tōdai-ji', location: 'Nara',        order: 0, emoji: '🦌', duration: '5h' },
  { id: 'act-46', dayId: 'day-11', section: 'afternoon', title: 'Tōdai-ji Temple',         time: '10:00 AM', notes: 'World\'s largest wooden building, giant bronze Buddha',   location: 'Nara',        order: 1, emoji: '🏛️', duration: '1.5h' },
  { id: 'act-47', dayId: 'day-11', section: 'evening',   title: 'Back to Kyoto – Izakaya', time: '6:00 PM',  notes: 'Relax with yakitori and cold beer in Kawaramachi',       location: 'Kawaramachi', order: 0, emoji: '🍺', duration: '2h' },

  // Day 12 - Kyoto last day
  { id: 'act-48', dayId: 'day-12', section: 'morning',   title: 'Kiyomizu-dera Temple',    time: '7:30 AM',  notes: 'Arrive early – wooden stage views over Kyoto',           location: 'Higashiyama', order: 0, emoji: '⛩️', duration: '2h' },
  { id: 'act-49', dayId: 'day-12', section: 'morning',   title: 'Ninenzaka & Sannenzaka',  time: '10:00 AM', notes: 'Historic stone-paved lanes, ceramics and snacks',         location: 'Higashiyama', order: 1, emoji: '🏘️', duration: '1.5h' },
  { id: 'act-50', dayId: 'day-12', section: 'afternoon', title: 'Kyoto Gyoen (Palace Park)',time: '1:00 PM',  notes: 'Peaceful park around the Imperial Palace',               location: 'Kyoto Gyoen', order: 0, emoji: '🌳', duration: '1.5h' },
  { id: 'act-51', dayId: 'day-12', section: 'evening',   title: 'Farewell Kyoto dinner',   time: '7:00 PM',  notes: 'Book a kaiseki at a traditional machiya restaurant',     location: 'Gion',        order: 0, emoji: '🍱', duration: '2.5h' },

  // Day 13 - Osaka arrival
  { id: 'act-52', dayId: 'day-13', section: 'morning',   title: 'Shinkansen to Osaka',     time: '10:00 AM', notes: 'Quick 15-min hop from Kyoto – check in near Namba',      location: 'Osaka Station', order: 0, emoji: '🚄', duration: '1h' },
  { id: 'act-53', dayId: 'day-13', section: 'afternoon', title: 'Osaka Castle',            time: '1:00 PM',  notes: 'Castle keep with views, moat walk, good picnic spot',    location: 'Osaka Castle', order: 0, emoji: '🏯', duration: '2h' },
  { id: 'act-54', dayId: 'day-13', section: 'afternoon', title: 'Dotonbori walk',          time: '4:00 PM',  notes: 'Neon signs, Glico man, canal boats',                    location: 'Dotonbori',   order: 1, emoji: '🌃', duration: '1.5h' },
  { id: 'act-55', dayId: 'day-13', section: 'evening',   title: 'Takoyaki at Wanaka',      time: '6:00 PM',  notes: 'Osaka street food institution – octopus balls!',         location: 'Dotonbori',   order: 0, emoji: '🐙', duration: '30m' },
  { id: 'act-56', dayId: 'day-13', section: 'evening',   title: 'Kushikatsu at Daruma',    time: '7:30 PM',  notes: 'Deep-fried skewers, no double-dipping rule!',            location: 'Shinsekai',   order: 1, emoji: '🍢', duration: '1.5h' },

  // Day 14 - Osaka last day / departure
  { id: 'act-57', dayId: 'day-14', section: 'morning',   title: 'Kuromon Ichiba Market',   time: '9:00 AM',  notes: 'Fresh seafood and street food for breakfast/brunch',     location: 'Kuromon',     order: 0, emoji: '🦞', duration: '1.5h' },
  { id: 'act-58', dayId: 'day-14', section: 'morning',   title: 'Shinsekai district',      time: '11:00 AM', notes: 'Retro 1920s atmosphere, Tsutenkaku tower',               location: 'Shinsekai',   order: 1, emoji: '🗼', duration: '1h' },
  { id: 'act-59', dayId: 'day-14', section: 'afternoon', title: 'Head to Kansai Airport',  time: '2:00 PM',  notes: 'Haruka express ~75 min – allow extra time for check-in', location: 'Tennoji',     order: 0, emoji: '✈️', duration: '2.5h' },

  // Activity ideas tagged to Tokyo (show on Tokyo day pages, not on main maybe list)
  { id: 'act-13', dayId: 'maybe', section: 'maybe', title: 'teamLab Planets',         notes: 'Digital art museum in Toyosu – book ahead',           location: 'Toyosu',     locationId: 'loc-tokyo', order: 0, emoji: '🎨' },
  { id: 'act-14', dayId: 'maybe', section: 'maybe', title: 'Tsukiji Outer Market',    notes: 'Best breakfast in Tokyo – fresh tuna, tamagoyaki',   location: 'Tsukiji',    locationId: 'loc-tokyo', order: 1, emoji: '🐟' },
  { id: 'act-15', dayId: 'maybe', section: 'maybe', title: 'Nakameguro Canal Walk',   notes: 'Especially beautiful with cherry blossoms',          location: 'Nakameguro', locationId: 'loc-tokyo', order: 2, emoji: '🌊' },

  // Activity ideas tagged to Hakone
  { id: 'act-hk-1', dayId: 'maybe', section: 'maybe', title: 'Mt. Fuji viewpoint',       notes: 'Gotemba area – best clear-day Fuji views',           location: 'Gotemba',    locationId: 'loc-hakone', order: 0, emoji: '🗻' },
  { id: 'act-hk-2', dayId: 'maybe', section: 'maybe', title: 'Owakudani volcanic valley', notes: 'Black eggs boiled in sulfur springs',               location: 'Owakudani',  locationId: 'loc-hakone', order: 1, emoji: '🌋' },

  // Activity ideas tagged to Kyoto
  { id: 'act-ky-1', dayId: 'maybe', section: 'maybe', title: 'Tea ceremony',              notes: 'Book a private or group ceremony in a machiya',      location: 'Gion',       locationId: 'loc-kyoto', order: 0, emoji: '🍵' },
  { id: 'act-ky-2', dayId: 'maybe', section: 'maybe', title: 'Daitoku-ji complex',        notes: 'Quiet temple complex, beautiful zen gardens',         location: 'Kita',       locationId: 'loc-kyoto', order: 1, emoji: '🧘' },
  { id: 'act-ky-3', dayId: 'maybe', section: 'maybe', title: 'Kibune River dining',       notes: 'Dinner on platforms over the river in summer',        location: 'Kibune',     locationId: 'loc-kyoto', order: 2, emoji: '🏞️' },

  // Activity ideas tagged to Osaka
  { id: 'act-os-1', dayId: 'maybe', section: 'maybe', title: 'Universal Studios Japan',   notes: 'Harry Potter World, great for a full day',           location: 'USJ',        locationId: 'loc-osaka', order: 0, emoji: '🎢' },
  { id: 'act-os-2', dayId: 'maybe', section: 'maybe', title: 'Tempozan Ferris Wheel',     notes: 'One of Japan\'s largest – harbor views',             location: 'Tempozan',   locationId: 'loc-osaka', order: 1, emoji: '🎡' },

  // City-level suggestions (no locationId = appear on main page Maybe List as city ideas)
  { id: 'act-city-1', dayId: 'maybe', section: 'maybe', title: 'Hiroshima',  notes: 'Vredesmonument, Miyajima eiland met drijvend torii-poort', order: 0, emoji: '🕊️' },
  { id: 'act-city-2', dayId: 'maybe', section: 'maybe', title: 'Nara',       notes: 'Vrije hertjes in het park, Tōdai-ji tempel', order: 1, emoji: '🦌' },
  { id: 'act-city-3', dayId: 'maybe', section: 'maybe', title: 'Nikko',      notes: 'Prachtige tempels en shrines in het bos, dagtrip vanuit Tokyo', order: 2, emoji: '🏔️' },
];
