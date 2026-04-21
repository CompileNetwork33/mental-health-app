'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client.js';

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

      const aiResponse = typeof data.message === 'string' 
        ? data.message 
        : JSON.stringify(data.message);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        message: aiResponse || 'I am here with you.',
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

  async function handleClearChat() {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        setError('Failed to clear chat history.');
        return;
      }
      
      setMessages([serenityGreeting]);
    } catch (clearError) {
      setError('Something went wrong while clearing chat.');
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#2D2D2D]">
      <div className="mx-auto w-full max-w-6xl">
        <section className="flex h-[calc(100vh-7rem)] min-h-[600px] flex-1 flex-col rounded-3xl border border-[#E1E8ED] bg-white shadow-md">
          <header className="flex items-center justify-between rounded-t-3xl border-b border-[#E1E8ED] bg-[#F5F7FA] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00BFA5] text-lg text-white">
                �
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#2D2D2D]">Serenity</h1>
                <p className="text-xs text-[#00BFA5]">Compassionate AI Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                disabled={!userId || loading}
                className="rounded-full bg-[#1A73E8] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Chat
              </button>
              <span className="rounded-full bg-[#00BFA5] px-3 py-1 text-xs font-medium text-white">
                Safe Space
              </span>
            </div>
          </header>

          {error ? (
            <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-4 sm:mx-6">
              <p className="text-sm text-red-700 font-medium mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          ) : null}
          <div className="mx-4 mt-3 sm:mx-6">
            <a
              href="tel:9152987821"
              className="inline-block rounded-2xl bg-[#1A73E8] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Crisis Helpline (iCall): 9152987821
            </a>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
            {loading ? (
              <div className="rounded-2xl bg-white p-4 text-sm text-[#2D2D2D]">Loading your chat history...</div>
            ) : messages.length <= 1 ? (
              <div className="rounded-2xl bg-[#F5F7FA] border border-[#E6ECF5] p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#EAF3FE] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1A73E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-[#1A73E8] mb-2">Start your conversation</h3>
                <p className="text-sm text-gray-600">I'm here to listen and support you. Share what's on your mind and I'll help you work through it.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] ${
                        isUser
                          ? 'rounded-br-md bg-[#1A73E8] text-white'
                          : 'rounded-bl-md bg-[#00BFA5] text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p className={`mt-1 text-[10px] ${isUser ? 'text-blue-100' : 'text-teal-100'}`}>
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
                <div className="rounded-2xl rounded-bl-md bg-[#00BFA5] px-4 py-3 text-sm text-white shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSend}
            className="rounded-b-3xl border-t border-[#E1E8ED] bg-[#F5F7FA] p-4 sm:p-6"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Share what is on your mind..."
                rows={2}
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[#E1E8ED] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition placeholder:text-slate-500 focus:border-[#1A73E8]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || !userId}
                className="rounded-2xl bg-[#1A73E8] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
