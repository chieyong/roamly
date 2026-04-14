import type { Activity, ActivityEnrichment, AISuggestion, Section } from '$lib/types';

// ─── Mock suggestion bank ─────────────────────────────────────────────────────
// Keyed by location keyword → suggestions
// In production: replace these functions with OpenAI API calls

const suggestionBank: Record<string, AISuggestion[]> = {
  tokyo: [
    { title: 'Senso-ji Temple at dawn', notes: 'Magical before the crowds arrive – aim for 6 AM', emoji: '🏮', duration: '1.5h' },
    { title: 'Yanaka old town wander', notes: 'Old Edo atmosphere, crafts shops, cat cafés', emoji: '🐱', duration: '2h' },
    { title: 'Tsukiji outer market breakfast', notes: 'Tamagoyaki, fresh sushi, grilled scallops', emoji: '🐟', duration: '1h' },
    { title: 'Robot Restaurant show', notes: 'Totally over-the-top, totally worth it', emoji: '🤖', duration: '2h' },
    { title: 'Ginza gallery hopping', notes: 'World-class free galleries in the Itchome area', emoji: '🎨', duration: '2h' },
    { title: 'Hamarikyu Gardens tea ceremony', notes: 'Tranquil garden with an authentic teahouse', emoji: '🍵', duration: '1.5h' },
  ],
  kyoto: [
    { title: 'Fushimi Inari sunrise hike', notes: 'Leave by 5:30 AM – thousands of torii gates, zero tourists', emoji: '⛩️', duration: '3h' },
    { title: 'Philosopher\'s Path stroll', notes: 'Cherry tree-lined canal, peaceful pace', emoji: '🌸', duration: '1h' },
    { title: 'Nishiki Market breakfast', notes: '"Kyoto\'s kitchen" – pickles, street food, tofu', emoji: '🥡', duration: '1.5h' },
    { title: 'Arashiyama Bamboo Grove', notes: 'Go early, it\'s magical in the mist', emoji: '🎋', duration: '1h' },
    { title: 'Gion evening walk', notes: 'Spot geiko and maiko in traditional Gion', emoji: '🌙', duration: '2h' },
    { title: 'Kinkaku-ji Golden Pavilion', notes: 'Iconic gold temple – book timed entry online', emoji: '✨', duration: '1h' },
  ],
  hakone: [
    { title: 'Hakone Open Air Museum', notes: 'Outdoor sculpture park, stunning mountain backdrop', emoji: '🗿', duration: '2.5h' },
    { title: 'Onsen at Tenzan Tohji-kyo', notes: 'Best rotenburo (outdoor baths) in Hakone', emoji: '♨️', duration: '2h' },
    { title: 'Ashi Lake boat cruise', notes: 'Mt Fuji views on a clear day', emoji: '⛵', duration: '1h' },
    { title: 'Owakudani volcanic valley', notes: 'Black eggs cooked in sulfuric vents', emoji: '🥚', duration: '1.5h' },
  ],
  osaka: [
    { title: 'Dotonbori street food tour', notes: 'Takoyaki, okonomiyaki, kushikatsu – go hungry', emoji: '🐙', duration: '2h' },
    { title: 'Osaka Castle and park', notes: 'Free to walk the grounds, beautiful grounds', emoji: '🏯', duration: '2h' },
    { title: 'Kuromon Ichiba Market', notes: 'Local "Osaka\'s kitchen" – amazing fresh seafood', emoji: '🦐', duration: '1h' },
    { title: 'Shinsekai retro district', notes: 'Old Osaka atmosphere, kushikatsu restaurants', emoji: '🌃', duration: '2h' },
  ],
  default: [
    { title: 'Local market visit', notes: 'Great way to soak in the local culture and grab breakfast', emoji: '🛒', duration: '1.5h' },
    { title: 'Neighborhood walk', notes: 'Just wander – best discoveries happen unplanned', emoji: '🚶', duration: '1h' },
    { title: 'Coffee shop morning ritual', notes: 'Find the best local specialty coffee spot', emoji: '☕', duration: '45m' },
    { title: 'Museum afternoon', notes: 'Local history or art museum', emoji: '🏛️', duration: '2h' },
  ]
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns 3 activity suggestions based on location context */
export async function suggestActivities(location: string): Promise<AISuggestion[]> {
  // Simulate async API call
  await delay(900);

  const key = location.toLowerCase();
  const found = Object.keys(suggestionBank).find((k) => key.includes(k));
  const pool = suggestionBank[found ?? 'default'];

  // Return 3 random suggestions
  return shuffle(pool).slice(0, 3);
}

/** "Optimizes" a day by sorting activities by time of day logic */
export async function optimizeDay(activities: Activity[], location: string): Promise<Activity[]> {
  await delay(1200);

  const sectionOrder: Section[] = ['morning', 'afternoon', 'evening'];

  // Heuristic: outdoor/shrine in morning, shopping/culture afternoon, food/drinks evening
  const morningKeywords = ['shrine', 'temple', 'park', 'market', 'hike', 'walk', 'sunrise'];
  const eveningKeywords = ['dinner', 'drinks', 'bar', 'ramen', 'sushi', 'restaurant', 'izakaya', 'night'];

  return activities.map((act) => {
    const text = (act.title + ' ' + (act.notes ?? '')).toLowerCase();
    let suggestedSection: Section = 'afternoon';
    if (morningKeywords.some((k) => text.includes(k))) suggestedSection = 'morning';
    else if (eveningKeywords.some((k) => text.includes(k))) suggestedSection = 'evening';
    return { ...act, section: suggestedSection };
  });
}

// ─── Activity enrichment ──────────────────────────────────────────────────────

const TOKYO_NEIGHBORHOODS = [
  'Shinjuku', 'Shibuya', 'Harajuku', 'Ueno', 'Akihabara', 'Asakusa',
  'Ginza', 'Roppongi', 'Nakameguro', 'Shimokitazawa', 'Ikebukuro',
  'Yanaka', 'Tsukiji', 'Toyosu', 'Odaiba', 'Kanda',
];

// [ keywords[] , emoji ]
const EMOJI_RULES: Array<[string[], string]> = [
  [['breakfast', 'brunch', 'pancake', 'egg'], '🍳'],
  [['coffee', 'café', 'cafe', 'matcha', 'tea ceremony', 'teahouse'], '☕'],
  [['tea'], '🍵'],
  [['lunch', 'bento'], '🍱'],
  [['ramen', 'soba', 'udon', 'noodle'], '🍜'],
  [['sushi', 'sashimi', 'tuna', 'seafood'], '🍣'],
  [['dinner', 'restaurant', 'izakaya', 'yakitori', 'tempura', 'tonkatsu', 'eat', 'food'], '🍽️'],
  [['bar', 'drinks', 'beer', 'cocktail', 'sake', 'whisky'], '🍻'],
  [['temple', 'shrine', 'torii', 'jinja', 'senso', 'meiji', 'fushimi'], '⛩️'],
  [['museum', 'gallery', 'art', 'exhibition', 'teamlab'], '🏛️'],
  [['park', 'garden', 'nature', 'bamboo', 'forest'], '🌿'],
  [['shopping', 'market', 'store', 'mall', 'vintage', 'fashion'], '🛍️'],
  [['walk', 'wander', 'stroll', 'street', 'explore', 'neighborhood'], '🚶'],
  [['observation', 'sky', 'tower', 'view', 'rooftop', 'crossing'], '🌆'],
  [['hotel', 'check in', 'check-in', 'hostel', 'airbnb'], '🏨'],
  [['onsen', 'hot spring', 'bath', 'spa', 'rotenburo'], '♨️'],
  [['hike', 'mountain', 'fuji', 'climb'], '🗻'],
  [['train', 'station', 'transit', 'travel', 'transfer'], '🚆'],
  [['concert', 'show', 'performance', 'theatre', 'live'], '🎵'],
  [['game', 'arcade', 'nintendo', 'pokemon', 'anime', 'manga'], '🎮'],
];

const NOTES_RULES: Array<[string[], string]> = [
  [['shrine', 'temple'], 'Go early — crowds pick up fast after 9 AM'],
  [['observation', 'sky', 'tower', 'rooftop'], 'Book tickets in advance for guaranteed entry'],
  [['ramen', 'soba'], 'Expect a short queue at popular spots — worth the wait'],
  [['onsen', 'hot spring'], 'Bring a small towel or rent one at the entrance'],
  [['market', 'tsukiji'], 'Best explored on an empty stomach'],
  [['teamlab', 'digital art'], 'Book tickets well ahead — sells out weeks in advance'],
  [['crossing', 'shibuya'], 'Rush hour (5–7 PM) gives you the full scramble experience'],
  [['arcade', 'game'], 'Bring coins — machines only take ¥100 coins, not bills'],
];

function inferEmoji(text: string): string {
  for (const [keywords, emoji] of EMOJI_RULES) {
    if (keywords.some((k) => text.includes(k))) return emoji;
  }
  return '📍';
}

function inferTime(text: string, section: Section): string {
  if (section === 'morning') {
    if (/shrine|temple|torii|sunrise|dawn|hike/.test(text)) return '7:00 AM';
    if (/breakfast|brunch|egg/.test(text))                   return '8:30 AM';
    if (/coffee|café|cafe|matcha/.test(text))               return '9:00 AM';
    return '9:30 AM';
  }
  if (section === 'afternoon') {
    if (/lunch|bento/.test(text))            return '12:30 PM';
    if (/museum|gallery|art|exhibition/.test(text)) return '1:00 PM';
    if (/shopping|market/.test(text))        return '2:00 PM';
    return '1:30 PM';
  }
  if (section === 'evening') {
    if (/dinner|ramen|sushi|restaurant|izakaya/.test(text)) return '7:00 PM';
    if (/bar|drinks|cocktail|beer|sake/.test(text))         return '8:30 PM';
    if (/show|concert|performance/.test(text))              return '7:30 PM';
    return '6:30 PM';
  }
  return '9:00 AM';
}

function inferDuration(text: string): string {
  if (/coffee|café|cafe|matcha/.test(text))                return '45m';
  if (/breakfast|brunch/.test(text))                        return '1h';
  if (/lunch|bento/.test(text))                             return '1.5h';
  if (/dinner|ramen|sushi|restaurant|izakaya/.test(text))  return '1.5h';
  if (/bar|drinks|cocktail|beer|sake/.test(text))          return '2h';
  if (/museum|gallery|exhibition|teamlab/.test(text))      return '2.5h';
  if (/shrine|temple|torii/.test(text))                    return '1.5h';
  if (/onsen|hot spring|bath/.test(text))                  return '2h';
  if (/shopping|market/.test(text))                        return '2h';
  if (/hike|mountain|fuji/.test(text))                     return '3h';
  if (/walk|wander|stroll|explore/.test(text))             return '1h';
  if (/observation|sky|tower|view/.test(text))             return '1.5h';
  return '1h';
}

function inferNotes(text: string): string | null {
  for (const [keywords, note] of NOTES_RULES) {
    if (keywords.some((k) => text.includes(k))) return note;
  }
  return null;
}

/**
 * Given a raw activity title and the section it's being added to,
 * returns enriched metadata: emoji, location, suggested time, duration, notes.
 */
export async function enrichActivity(
  title: string,
  section: Section
): Promise<ActivityEnrichment> {
  await delay(700); // simulate a quick async call

  const text = title.toLowerCase();

  const location =
    TOKYO_NEIGHBORHOODS.find((n) => text.includes(n.toLowerCase())) ?? null;

  return {
    emoji:    inferEmoji(text),
    location,
    time:     inferTime(text, section),
    duration: inferDuration(text),
    notes:    inferNotes(text),
  };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
