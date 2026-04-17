'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client.js';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mood Tracker', href: '/mood-tracker' },
  { label: 'Journal', href: '/journal' },
  { label: 'Chat with AI', href: '/chat' },
];

const serenityGreeting = {
  id: 'greeting',
  role: 'assistant',
  message:
    "Hi, I'm Serenity. I am here to listen and support you. How are you feeling right now?",
  created_at: new Date().toISOString(),
};

export default function ChatPage() {
  const supabase = useMemo(() => createClient(), []);
  const scrollRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState([serenityGreeting]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const loadChatHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'Please log in to use Serenity chat.');
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (chatsError) {
      setError(chatsError.message);
      setLoading(false);
      return;
    }

    const normalized = (data || []).map((row) => ({
      id: row.id,
      role: row.role || row.sender || 'assistant',
      message: row.message || row.content || '',
      created_at: row.created_at || new Date().toISOString(),
    }));

    setMessages(normalized.length > 0 ? normalized : [serenityGreeting]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function persistChatMessage(message) {
    const { error: insertError } = await supabase.from('chats').insert({
      user_id: userId,
      role: message.role,
      message: message.message,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || sending || !userId) return;

    setSending(true);
    setTyping(true);
    setError('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: cleanInput,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      await persistChatMessage(userMessage);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.message,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get Serenity response.');
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        message: data.reply || 'I am here with you.',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await persistChatMessage(assistantMessage);
    } catch (sendError) {
      setError(sendError.message || 'Something went wrong while sending your message.');
    } finally {
      setTyping(false);
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF9F5] text-[#2D2D2D]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
        <aside className="rounded-3xl border border-[#FFE8DC] bg-[#FFE8DC] p-4 shadow-md md:sticky md:top-6 md:h-fit md:w-64">
          <h2 className="mb-4 text-lg font-semibold text-[#6B4EFF]">Mental Health Companion</h2>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  item.href === '/chat'
                    ? 'bg-[#6B4EFF] text-white'
                    : 'bg-white text-[#6B4EFF] hover:bg-[#FFD93D]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href="tel:9152987821"
            className="mt-4 block rounded-2xl bg-[#FF6B6B] px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
          >
            Crisis Helpline (iCall): 9152987821
          </a>
        </aside>

        <section className="flex h-[calc(100vh-2rem)] min-h-[600px] flex-1 flex-col rounded-3xl border border-[#FFE8DC] bg-[#FFE8DC] shadow-md">
          <header className="flex items-center justify-between rounded-t-3xl border-b border-[#FFD93D] bg-[#FFF9F5] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6B4EFF] text-lg text-white">
                🌸
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#2D2D2D]">Serenity</h1>
                <p className="text-xs text-[#6B4EFF]">Compassionate AI Companion</p>
              </div>
            </div>
            <span className="rounded-full bg-[#FFD93D] px-3 py-1 text-xs font-medium text-[#2D2D2D]">
              Safe Space
            </span>
          </header>

          {error ? (
            <div className="mx-4 mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 sm:mx-6">{error}</div>
          ) : null}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
            {loading ? (
              <div className="rounded-2xl bg-white p-4 text-sm text-[#2D2D2D]">Loading your chat history...</div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] ${
                        isUser
                          ? 'rounded-br-md bg-[#6B4EFF] text-white'
                          : 'rounded-bl-md bg-white text-[#2D2D2D]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p className={`mt-1 text-[10px] ${isUser ? 'text-violet-200' : 'text-slate-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {typing ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#2D2D2D] shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#FF6B6B]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#FF6B6B] [animation-delay:0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#FF6B6B] [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSend}
            className="rounded-b-3xl border-t border-[#FFD93D] bg-[#FFF9F5] p-4 sm:p-6"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Share what is on your mind..."
                rows={2}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[#FFE8DC] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition placeholder:text-slate-500 focus:border-[#6B4EFF]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || !userId}
                className="rounded-2xl bg-[#6B4EFF] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
