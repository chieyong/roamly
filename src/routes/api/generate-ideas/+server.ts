/**
 * POST /api/generate-ideas
 *
 * Generates activity suggestions for a specific city/day using OpenAI.
 * Context: all already-planned trip activities + day-specific activities.
 */
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { Activity } from '$lib/types';
import { json, error, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw error(500, 'OpenAI API key not configured');

  const openai = new OpenAI({ apiKey });

  const body = await request.json();
  const locationName: string  = body.locationName ?? 'this city';
  const dayDate: string       = body.dayDate ?? '';
  const dayActivities: Activity[]  = body.dayActivities  ?? [];
  const tripActivities: Activity[] = body.tripActivities ?? [];

  // Build context strings
  const dayContext = dayActivities.length > 0
    ? dayActivities.map(a => `- ${a.title}${a.location ? ` (${a.location})` : ''}${a.time ? ` @ ${a.time}` : ''}`).join('\n')
    : '(no activities planned yet for this day)';

  const tripContext = tripActivities.length > 0
    ? tripActivities.map(a => `- ${a.title}${a.location ? ` in ${a.location}` : ''}`).join('\n')
    : '(none yet)';

  const prompt = `You are a Japan travel expert. Generate exactly 4 fresh activity ideas for a visit to ${locationName}${dayDate ? ` on ${dayDate}` : ''}.

Already planned for THIS DAY:
${dayContext}

Already planned across the WHOLE TRIP (do not duplicate these):
${tripContext}

Rules:
- Do NOT suggest anything that is already in either list above
- If the day already has activities in a specific area/neighborhood, prioritize ideas that are nearby or complement those activities
- If the day has no activities yet, suggest a diverse mix covering different neighborhoods or types of experience
- Each idea should be practical and specific to ${locationName}
- Keep notes to one concise sentence with a practical tip

Return ONLY a valid JSON array — no other text:
[
  { "title": "Activity name", "notes": "One practical tip sentence.", "location": "Neighborhood or area name" }
]`;

  const completion = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  600,
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

  let ideas: Array<{ title: string; notes: string; location?: string }> = [];
  try {
    // The model might return { ideas: [...] } or just [...]
    const parsed = JSON.parse(raw);
    ideas = Array.isArray(parsed) ? parsed : (parsed.ideas ?? parsed.suggestions ?? []);
  } catch {
    throw error(500, 'Failed to parse AI response');
  }

  return json({ ideas });
};
