import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('Key starts with:', process.env.GROQ_API_KEY?.substring(0, 10));
    const { messages } = await req.json();

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are Serenity, a compassionate mental health companion. You listen carefully, show empathy, and provide supportive responses. Never give medical advice. Always be warm and caring. If someone is in crisis suggest helpline: iCall 9152987821'
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();
    console.log('Groq Response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Groq Error:', data);
      return NextResponse.json({ 
        error: data.error || 'API Error' 
      }, { status: 400 });
    }

    const messageContent = data.choices[0].message.content;
    return NextResponse.json({ message: messageContent });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
