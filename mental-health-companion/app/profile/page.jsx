'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client.js';

function calculateStreak(moodDates) {
  const uniqueDays = Array.from(
    new Set(
      moodDates.map((date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    )
  ).sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i += 1) {
    const day = new Date(uniqueDays[i]);
    day.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (day.getTime() === expected.getTime()) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);
  const [userId, setUserId] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState('all');
  const [themePreference, setThemePreference] = useState('system');

  const [totalJournalEntries, setTotalJournalEntries] = useState(0);
  const [daysTrackedMood, setDaysTrackedMood] = useState(0);
  const [streakCounter, setStreakCounter] = useState(0);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'Please log in to view your profile.');
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setEmail(user.email || '');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name,name,bio,avatar_url,daily_reminder,notification_preference,theme_preference')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (profileData) {
      setFullName(profileData.full_name || profileData.name || '');
      setBio(profileData.bio || '');
      setAvatarUrl(profileData.avatar_url || '');
      setDailyReminder(Boolean(profileData.daily_reminder));
      setNotificationPreference(profileData.notification_preference || 'all');
      setThemePreference(profileData.theme_preference || 'system');
    } else {
      setFullName(user.user_metadata?.name || '');
      setBio('');
      setAvatarUrl('');
      setDailyReminder(false);
      setNotificationPreference('all');
      setThemePreference('system');
    }

    const { count: journalCount } = await supabase
      .from('journals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setTotalJournalEntries(journalCount || 0);

    const { data: moodRows } = await supabase.from('moods').select('created_at').eq('user_id', user.id);
    const moodDates = (moodRows || []).map((row) => row.created_at);
    const uniqueDays = new Set(
      moodDates.map((date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    setDaysTrackedMood(uniqueDays.size);
    setStreakCounter(calculateStreak(moodDates));

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAvatar(true);
    setError('');
    setSuccessMessage('');

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt || 'jpg'}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(publicUrlData.publicUrl);
    setSuccessMessage('Avatar uploaded. Save changes to apply it to your profile.');
    setUploadingAvatar(false);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      id: userId,
      full_name: fullName.trim(),
      name: fullName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      daily_reminder: dailyReminder,
      notification_preference: notificationPreference,
      theme_preference: themePreference,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSuccessMessage('Profile and settings saved successfully.');
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'This will delete your app data (profile, journals, moods, chats) and log you out. Continue?'
    );
    if (!confirmed || !userId) return;

    setProcessingDelete(true);
    setError('');
    setSuccessMessage('');

    await supabase.from('journals').delete().eq('user_id', userId);
    await supabase.from('moods').delete().eq('user_id', userId);
    await supabase.from('chats').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);

    await supabase.auth.signOut();
    router.push('/signup');
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
        <div className="w-full max-w-sm rounded-3xl border border-[#E6ECF5] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#C5D8F5] border-t-[#1A73E8]" />
          <p className="text-sm text-[#1A1A2E]">Loading profile and settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1A1A2E]">
      <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-6">
        <section className="space-y-4 md:space-y-6">
          <header className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
            <h1 className="text-2xl font-semibold text-[#1A73E8] md:text-3xl">Profile & Settings</h1>
            <p className="mt-2 text-sm text-[#1A1A2E]/80">
              Personalize your companion experience and manage your wellness preferences.
            </p>
            {error ? <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            {successMessage ? (
              <p className="mt-4 rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
            ) : null}
          </header>

          <div className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md xl:col-span-2">
              <h2 className="text-lg font-semibold text-[#1A73E8]">Edit profile</h2>
              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#00BFA5] bg-[#DDF3EF] text-2xl font-bold text-[#1A73E8]">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (fullName?.charAt(0) || email?.charAt(0) || 'U').toUpperCase()
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1A1A2E]">Upload avatar</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="w-full max-w-xs rounded-xl border border-[#CFE4FF] bg-[#F5F7FA] px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-[#1A1A2E]/70">
                      {uploadingAvatar ? 'Uploading avatar...' : 'PNG/JPG recommended.'}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="full-name" className="mb-2 block text-sm font-medium text-[#1A1A2E]">
                    Full name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm outline-none transition focus:border-[#1A73E8]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#1A1A2E]">
                    Email (read only)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-[#E6ECF5] bg-[#EEF2F7] px-4 py-3 text-sm text-[#1A1A2E]/70"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="mb-2 block text-sm font-medium text-[#1A1A2E]">
                    Bio / About me
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={5}
                    placeholder="Share a little about yourself..."
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm outline-none transition focus:border-[#1A73E8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00BFA5] to-[#1A73E8] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving changes...' : 'Save changes'}
                </button>
              </form>
            </article>

            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-[#1A73E8]">Your stats</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[#F5F7FA] p-4">
                  <p className="text-xs text-[#1A1A2E]/70">Total journal entries</p>
                  <p className="mt-1 text-2xl font-bold text-[#1A73E8]">{totalJournalEntries}</p>
                </div>
                <div className="rounded-2xl bg-[#F5F7FA] p-4">
                  <p className="text-xs text-[#1A1A2E]/70">Days tracked mood</p>
                  <p className="mt-1 text-2xl font-bold text-[#00BFA5]">{daysTrackedMood}</p>
                </div>
                <div className="rounded-2xl bg-[#FFF6E8] p-4">
                  <p className="text-xs text-[#1A1A2E]/70">Current streak</p>
                  <p className="mt-1 text-2xl font-bold text-[#FFB347]">{streakCounter} days</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-[#1A73E8]">Settings</h2>
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#F5F7FA] p-4">
                  <span className="text-sm font-medium text-[#1A1A2E]">Daily reminder</span>
                  <button
                    type="button"
                    onClick={() => setDailyReminder((current) => !current)}
                    className={`h-8 w-14 rounded-full p-1 transition ${
                      dailyReminder ? 'bg-[#00BFA5]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white transition ${
                        dailyReminder ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>

                <div>
                  <label htmlFor="notifications" className="mb-2 block text-sm font-medium text-[#1A1A2E]">
                    Notification preferences
                  </label>
                  <select
                    id="notifications"
                    value={notificationPreference}
                    onChange={(event) => setNotificationPreference(event.target.value)}
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm outline-none transition focus:border-[#1A73E8]"
                  >
                    <option value="all">All notifications</option>
                    <option value="important">Important only</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="theme" className="mb-2 block text-sm font-medium text-[#1A1A2E]">
                    Theme preference
                  </label>
                  <select
                    id="theme"
                    value={themePreference}
                    onChange={(event) => setThemePreference(event.target.value)}
                    className="w-full rounded-2xl border border-[#CFE4FF] bg-[#F5F7FA] px-4 py-3 text-sm outline-none transition focus:border-[#1A73E8]"
                  >
                    <option value="system">System default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-[#1A73E8]">Account actions</h2>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Logout
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={processingDelete}
                  className="w-full rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processingDelete ? 'Deleting account data...' : 'Delete account'}
                </button>

                <p className="text-xs text-[#1A1A2E]/70">
                  Deleting account removes your app data and signs you out. This action cannot be undone.
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
