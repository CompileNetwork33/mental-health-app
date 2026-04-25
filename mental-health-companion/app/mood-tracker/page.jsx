'use client';

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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error: moodsError } = await supabase
      .from('moods')
      .select('id,mood,score,note,created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    if (moodsError) {
      setError(moodsError.message);
      setLoading(false);
      return;
    }

    setHistory(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const { data: existingTodayEntry, error: existingTodayError } = await supabase
      .from('moods')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString())
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (existingTodayError) {
      setError(existingTodayError.message);
      setSaving(false);
      return;
    }

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
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
        <div className="w-full max-w-sm rounded-3xl border border-[#E6ECF5] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#CFE4FF] border-t-[#1A73E8]" />
          <p className="text-slate-700">Loading your mood tracker...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1A1A2E] dark:bg-[#0a0a0a] dark:text-white">
      <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-6">
        <section className="space-y-4 md:space-y-6">
          <header className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#171717]">
            <h1 className="text-2xl font-semibold text-[#1A73E8] md:text-3xl">Mood Tracker</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
              Track how you feel each day and discover patterns in your emotional wellbeing.
            </p>
            {error ? (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 dark:bg-red-900/30 dark:border-red-800">
                <p className="text-sm text-red-700 font-medium mb-2 dark:text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-800 dark:text-red-300 dark:hover:bg-red-700"
                >
                  Refresh Page
                </button>
              </div>
            ) : null}
            {successMessage ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {successMessage}
              </p>
            ) : null}
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#171717]">
              <h2 className="text-lg font-semibold text-[#1A73E8]">Log today&apos;s mood</h2>
              <form onSubmit={handleSaveMood} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {moodOptions.map((option) => (
                    <button
                      type="button"
                      key={option.mood}
                      onClick={() => setSelectedMood(option)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${selectedMood.mood === option.mood
                        ? 'border-[#1A73E8] bg-[#EAF3FE] shadow dark:bg-[#1A73E8]/20'
                        : 'border-[#CFE4FF] bg-white hover:border-[#1A73E8] hover:bg-[#F5F7FA] dark:border-white/20 dark:bg-[#0a0a0a] dark:hover:bg-[#171717]'
                        }`}
                    >
                      <p className="text-2xl">{option.emoji}</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-white">{option.mood}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="mood-note" className="mb-2 block text-sm font-medium text-slate-700 dark:text-white">
                    Mood note / reason
                  </label>
                  <textarea
                    id="mood-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="What influenced your mood today?"
                    rows={4}
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#1A73E8] focus:bg-white dark:border-white/20 dark:bg-[#0a0a0a] dark:text-white dark:placeholder:text-white/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving mood...' : 'Save Mood'}
                </button>
              </form>
            </article>

            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-[#00BFA5]">Today&apos;s mood</h2>
              {todayEntry ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">
                    {todayEntry.mood} (Score: {todayEntry.score})
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-white/80">
                    {todayEntry.note ? todayEntry.note : 'No note added yet.'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-white/50">
                    Logged at {new Date(todayEntry.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/10 dark:text-white/70">
                  No mood tracked today yet. Add your first check-in above.
                </p>
              )}
            </article>
          </div>

          <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#171717]">
            <h2 className="text-lg font-semibold text-[#1A73E8]">Last 7 days mood history</h2>
            {history.length === 0 ? (
              <div className="mt-3 rounded-2xl bg-[#F5F7FA] border border-[#E6ECF5] p-6 text-center dark:bg-[#0a0a0a] dark:border-white/10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#EAF3FE] flex items-center justify-center dark:bg-[#1A73E8]/20">
                  <svg className="w-6 h-6 text-[#1A73E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-[#1A73E8] mb-2">No mood history yet</h3>
                <p className="text-sm text-gray-600 mb-3 dark:text-white/70">Start tracking your daily mood to see patterns and insights about your emotional wellbeing.</p>
                <div className="inline-flex items-center gap-2 text-xs text-[#00BFA5] bg-[#E6F7F4] px-3 py-2 rounded-full dark:bg-[#00BFA5]/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Track your first mood
                </div>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col justify-between gap-2 rounded-2xl bg-[#F5F7FA] p-3 text-sm text-slate-700 sm:flex-row sm:items-center dark:bg-[#0a0a0a] dark:text-white/80"
                  >
                    <div>
                      <p className="font-medium">
                        {entry.mood} (Score: {entry.score})
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/50">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-slate-600 sm:max-w-sm dark:text-white/60">{entry.note || 'No note provided.'}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#171717]">
            <h2 className="mb-4 text-lg font-semibold text-[#1A73E8]">Weekly mood chart</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE6F2" className="dark:stroke-white/10" />
                  <XAxis dataKey="day" stroke="#64748b" className="dark:stroke-white/50" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#64748b" className="dark:stroke-white/50" />
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1A73E8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#00BFA5' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-white/50">Mood score scale: 1 (Very Sad) to 5 (Very Happy)</p>
          </article>
        </section>
      </div>
    </main>
  );
}
