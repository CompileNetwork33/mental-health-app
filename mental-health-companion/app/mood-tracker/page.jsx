'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createClient } from '@/lib/supabase/client.js';

const moodOptions = [
  { mood: 'Very Happy', score: 5, emoji: '😄' },
  { mood: 'Happy', score: 4, emoji: '🙂' },
  { mood: 'Neutral', score: 3, emoji: '😐' },
  { mood: 'Sad', score: 2, emoji: '😔' },
  { mood: 'Very Sad', score: 1, emoji: '😢' },
];

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mood Tracker', href: '/mood-tracker' },
  { label: 'Journal', href: '/journal' },
  { label: 'Chat with AI', href: '/chat' },
];

function sameLocalDay(isoDate, now = new Date()) {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function MoodTrackerPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedMood, setSelectedMood] = useState(moodOptions[2]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const todayEntry = history.find((entry) => sameLocalDay(entry.created_at));

  const chartData = [...history]
    .reverse()
    .map((entry) => ({
      day: new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
      score: entry.score,
      mood: entry.mood,
    }));

  const loadMoods = useCallback(async () => {
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'Please log in to track your mood.');
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error: moodsError } = await supabase
      .from('moods')
      .select('id,mood,score,note,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    if (moodsError) {
      setError(moodsError.message);
      setLoading(false);
      return;
    }

    setHistory(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadMoods();
  }, [loadMoods]);

  async function handleSaveMood(event) {
    event.preventDefault();
    if (!userId) {
      setError('Please log in before saving mood.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      user_id: userId,
      mood: selectedMood.mood,
      score: selectedMood.score,
      note: note.trim(),
    };

    const existingTodayEntry = history.find((entry) => sameLocalDay(entry.created_at));

    let saveError = null;
    if (existingTodayEntry) {
      const { error: updateError } = await supabase
        .from('moods')
        .update({
          mood: payload.mood,
          score: payload.score,
          note: payload.note,
        })
        .eq('id', existingTodayEntry.id)
        .eq('user_id', userId);
      saveError = updateError;
    } else {
      const { error: insertError } = await supabase.from('moods').insert(payload);
      saveError = insertError;
    }

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSuccessMessage(
      existingTodayEntry
        ? 'Today’s mood entry updated successfully.'
        : 'Mood saved successfully. Keep caring for yourself.'
    );
    setNote('');
    await loadMoods();
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-violet-50 to-emerald-100 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
          <p className="text-slate-700">Loading your mood tracker...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-violet-50 to-emerald-100 text-slate-800">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
        <aside className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-lg backdrop-blur md:sticky md:top-6 md:h-fit md:w-64">
          <h2 className="mb-4 text-lg font-semibold text-violet-700">Mental Health Companion</h2>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  item.href === '/mood-tracker'
                    ? 'bg-violet-500 text-white'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex-1 space-y-4 md:space-y-6">
          <header className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
            <h1 className="text-2xl font-semibold text-violet-700 md:text-3xl">Mood Tracker</h1>
            <p className="mt-2 text-sm text-slate-600">
              Track how you feel each day and discover patterns in your emotional wellbeing.
            </p>
            {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            {successMessage ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
              <h2 className="text-lg font-semibold text-violet-700">Log today&apos;s mood</h2>
              <form onSubmit={handleSaveMood} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {moodOptions.map((option) => (
                    <button
                      type="button"
                      key={option.mood}
                      onClick={() => setSelectedMood(option)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selectedMood.mood === option.mood
                          ? 'border-violet-400 bg-violet-100 shadow'
                          : 'border-violet-100 bg-white hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      <p className="text-2xl">{option.emoji}</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{option.mood}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="mood-note" className="mb-2 block text-sm font-medium text-slate-700">
                    Mood note / reason
                  </label>
                  <textarea
                    id="mood-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="What influenced your mood today?"
                    rows={4}
                    className="w-full rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving mood...' : 'Save Mood'}
                </button>
              </form>
            </article>

            <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
              <h2 className="text-lg font-semibold text-emerald-700">Today&apos;s mood</h2>
              {todayEntry ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">
                    {todayEntry.mood} (Score: {todayEntry.score})
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {todayEntry.note ? todayEntry.note : 'No note added yet.'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Logged at {new Date(todayEntry.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  No mood tracked today yet. Add your first check-in above.
                </p>
              )}
            </article>
          </div>

          <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
            <h2 className="text-lg font-semibold text-violet-700">Last 7 days mood history</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No history yet. Start by saving your first mood entry.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col justify-between gap-2 rounded-2xl bg-violet-50 p-3 text-sm text-slate-700 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {entry.mood} (Score: {entry.score})
                      </p>
                      <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-slate-600 sm:max-w-sm">{entry.note || 'No note provided.'}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-lg backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-violet-700">Weekly mood chart</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd6fe" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#64748b" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Mood score scale: 1 (Very Sad) to 5 (Very Happy)</p>
          </article>
        </section>
      </div>
    </main>
  );
}
