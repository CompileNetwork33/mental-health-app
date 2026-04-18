import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are Serenity, a compassionate mental health companion. You listen carefully, show empathy, and provide supportive, caring responses. Never give medical advice. Always be warm, kind and understanding. If someone is in crisis suggest helpline: iCall 9152987821'
          },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Grok API Error:', data);
      return NextResponse.json({ error: data }, { status: 400 });
    }

    return NextResponse.json({ 
      message: data.choices[0].message.content 
    });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' }, 
      { status: 500 }
    );
  }
}
