'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Mood Tracker', href: '/mood-tracker' },
  { label: 'Journal', href: '/journal' },
  { label: 'Chat with AI', href: '/chat' },
  { label: 'Login', href: '/login' },
];

const moodScoreMap = {
  VeryLow: 1,
  Low: 2,
  Neutral: 3,
  Good: 4,
  Great: 5,
};

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('there');
  const [todayMood, setTodayMood] = useState('No mood logged today');
  const [journalEntries, setJournalEntries] = useState([]);
  const [weeklyMoodData, setWeeklyMoodData] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message || 'Could not load user details.');
        setLoading(false);
        return;
      }

      const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || 'there';
      setUserName(fallbackName);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name,full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData?.full_name || profileData?.name) {
        setUserName(profileData.full_name || profileData.name);
      }

      // Try common table names to avoid hard failure if schema differs.
      let moodResult = await supabase
        .from('mood_entries')
        .select('mood,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7);

      if (moodResult.error) {
        moodResult = await supabase
          .from('moods')
          .select('mood,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(7);
      }

      const moods = moodResult?.data || [];
      if (moods.length > 0) {
        setTodayMood(moods[0].mood || 'Mood captured');
        const formattedMood = [...moods]
          .reverse()
          .map((item) => ({
            day: new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
            score: moodScoreMap[item.mood] || 3,
            mood: item.mood,
          }));
        setWeeklyMoodData(formattedMood);
      } else {
        setWeeklyMoodData([
          { day: 'Mon', score: 0, mood: 'No data' },
          { day: 'Tue', score: 0, mood: 'No data' },
          { day: 'Wed', score: 0, mood: 'No data' },
          { day: 'Thu', score: 0, mood: 'No data' },
          { day: 'Fri', score: 0, mood: 'No data' },
          { day: 'Sat', score: 0, mood: 'No data' },
          { day: 'Sun', score: 0, mood: 'No data' },
        ]);
      }

      let journalResult = await supabase
        .from('journal_entries')
        .select('id,title,content,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (journalResult.error) {
        journalResult = await supabase
          .from('journals')
          .select('id,title,content,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
      }

      setJournalEntries(journalResult?.data || []);
      setLoading(false);
    }

    loadDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 via-amber-50 to-emerald-100 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
          <p className="text-slate-700">Loading your calm dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-100 via-amber-50 to-emerald-100 text-slate-800">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
        <aside className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-lg backdrop-blur md:sticky md:top-6 md:h-fit md:w-64">
          <h2 className="mb-4 text-lg font-semibold text-violet-700">Mental Health Companion</h2>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex-1 space-y-4 md:space-y-6">
          <header className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur">
            <p className="text-sm font-medium text-emerald-700">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Hi {userName}, how are you feeling today?</h1>
            {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur">
              <h3 className="text-lg font-semibold text-violet-700">Today&apos;s Mood Summary</h3>
              <p className="mt-3 text-2xl font-bold text-slate-800">{todayMood}</p>
              <p className="mt-2 text-sm text-slate-600">Your daily check-ins help reveal emotional patterns.</p>
            </article>

            <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur">
              <h3 className="text-lg font-semibold text-emerald-700">Recent Journal Entries</h3>
              <div className="mt-3 space-y-3">
                {journalEntries.length === 0 ? (
                  <p className="text-sm text-slate-600">No journal entries yet. Start writing your first reflection.</p>
                ) : (
                  journalEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-amber-50 p-3">
                      <p className="font-medium text-slate-800">{entry.title || 'Untitled entry'}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{entry.content || 'No content'}</p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>

          <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur">
            <h3 className="text-lg font-semibold text-violet-700">Quick Actions</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                href="/mood-tracker"
                className="rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Track Mood
              </Link>
              <Link
                href="/journal"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Write Journal
              </Link>
              <Link
                href="/chat"
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Chat with AI
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-violet-700">Weekly Mood Trend</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyMoodData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd6fe" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="#64748b" />
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
            <p className="mt-2 text-xs text-slate-500">Mood score: 1 (very low) to 5 (great)</p>
          </article>
        </section>
      </div>
    </main>
  );
}
