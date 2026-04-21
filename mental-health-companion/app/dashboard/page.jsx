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
import { createClient } from '@/lib/supabase/client.js';

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
        setError(userError?.message || 'Unable to load your profile. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }

      const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || 'there';
      setUserName(fallbackName);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData?.name) {
        setUserName(profileData.name);
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: moods, error: moodsError } = await supabase
        .from('moods')
        .select('id,mood,score,note,created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (moodsError) {
        setError('Failed to load mood data. Please refresh the page to try again.');
        setLoading(false);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayMoodEntry = (moods || []).find((item) => {
        const date = new Date(item.created_at);
        return date >= todayStart && date < todayEnd;
      });
      setTodayMood(todayMoodEntry ? `${todayMoodEntry.mood} (Score: ${todayMoodEntry.score})` : 'No mood logged today');

      setWeeklyMoodData(
        (moods || []).map((item) => ({
          day: new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
          score: item.score ?? 3,
          mood: item.mood,
        }))
      );

      const { data: journals, error: journalsError } = await supabase
        .from('journals')
        .select('id,title,content,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (journalsError) {
        setError('Failed to load journal entries. Please refresh the page to try again.');
        setLoading(false);
        return;
      }

      setJournalEntries(journals || []);
      setLoading(false);
    }

    loadDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] text-[#1A1A2E]">
        <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Header Skeleton */}
          <div className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-72 w-full bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1A1A2E]">
      <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-6 p-4 md:p-6">
        <section className="space-y-4 md:space-y-6">
          <header className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-[#00BFA5]">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Hi {userName}, how are you feeling today?</h1>
            {error ? (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700 font-medium mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            ) : null}
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h3 className="text-lg font-semibold text-[#1A73E8]">Today&apos;s Mood Summary</h3>
              <p className="mt-3 text-2xl font-bold text-slate-800">{todayMood}</p>
              <p className="mt-2 text-sm text-slate-600">Your daily check-ins help reveal emotional patterns.</p>
            </article>

            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h3 className="text-lg font-semibold text-[#00BFA5]">Recent Journal Entries</h3>
              <div className="mt-3 space-y-3">
                {journalEntries.length === 0 ? (
                  <p className="text-sm text-slate-600">No journal entries yet. Start writing your first reflection.</p>
                ) : (
                  journalEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-[#F5F7FA] p-3">
                      <p className="font-medium text-slate-800">{entry.title || 'Untitled entry'}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{entry.content || 'No content'}</p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>

          <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-[#1A73E8]">Quick Actions</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                href="/mood-tracker"
                className="rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Track Mood
              </Link>
              <Link
                href="/journal"
                className="rounded-2xl bg-gradient-to-r from-[#00BFA5] to-[#1A73E8] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Write Journal
              </Link>
              <Link
                href="/chat"
                className="rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Chat with AI
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#1A73E8]">Weekly Mood Trend</h3>
            <div className="h-72 w-full">
              {weeklyMoodData.length === 0 ? (
                <p className="rounded-2xl bg-[#F5F7FA] p-4 text-sm text-slate-600">No mood data in the last 7 days yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyMoodData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCE6F2" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#64748b" />
                    <Tooltip />
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
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">Mood score: 1 (very sad) to 5 (very happy)</p>
          </article>
        </section>
      </div>
    </main>
  );
}
