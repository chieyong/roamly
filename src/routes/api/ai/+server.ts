/**
 * POST /api/ai
 *
 * Body: { activity: Activity, messages: { role, content }[] }
 *
 * Calls OpenAI and returns a travel assistant reply.
 * The API key stays server-side — never sent to the client.
 */
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { Activity } from '$lib/types';
import { json, error, type RequestHandler } from '@sveltejs/kit';

const SYSTEM_PROMPT = `You are Roamly's travel assistant — a friendly, knowledgeable guide specializing in Japan travel.

When a user asks about a specific activity, you give concise, practical advice:
- Opening hours, ticket prices, booking tips
- Best time of day to visit
- How to get there (nearest station, walk time)
- What to bring or wear
- Hidden gems or insider tips
- Nearby things to combine it with

Keep responses short and conversational — 2–4 sentences unless the user asks for more detail.
Always be warm, helpful, and specific. Avoid generic advice.`;

export const POST: RequestHandler = async ({ request }: { request: Request }) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw error(500, 'OpenAI API key not configured');

  const openai = new OpenAI({ apiKey });

  const body = await request.json();
  const activity: Activity = body.activity;
  const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];

  if (!activity?.title) throw error(400, 'Missing activity');

  const activityContext = [
    `Activity: ${activity.title}`,
    activity.location ? `Location: ${activity.location}` : null,
    activity.time     ? `Planned time: ${activity.time}` : null,
    activity.duration ? `Duration: ${activity.duration}` : null,
    activity.notes    ? `Notes: ${activity.notes}`       : null,
  ]
    .filter(Boolean)
    .join('\n');

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `The user is asking about this planned activity:\n${activityContext}` },
    ...messages,
  ];

  const completion = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
    messages:    chatMessages,
    max_tokens:  400,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';
  return json({ reply });
};
