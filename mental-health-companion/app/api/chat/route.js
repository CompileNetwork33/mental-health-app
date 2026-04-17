import { NextResponse } from 'next/server';

const systemPrompt = `You are Serenity, a compassionate mental health companion. You listen carefully, show empathy, and provide supportive responses. Never give medical advice. Always be warm and caring.`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GROK_API_KEY.' }, { status: 500 });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: String(msg.content || ''),
          })),
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Failed to get response from Grok.' },
        { status: response.status }
      );
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: 'No reply from Grok.' }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
