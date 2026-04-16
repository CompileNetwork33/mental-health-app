'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 via-white to-emerald-100 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-4rem] top-12 h-40 w-40 rounded-full bg-violet-200/60 blur-3xl sm:h-56 sm:w-56" />
        <div className="absolute bottom-8 right-[-3rem] h-48 w-48 rounded-full bg-emerald-200/70 blur-3xl sm:h-64 sm:w-64" />
      </div>

      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
            Welcome back
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-800">
            Log in to your calm space
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Continue journaling, tracking your mood, and checking in with your mental wellness companion.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-violet-100 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-violet-700 transition hover:text-violet-900" href="/signup">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
