'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client.js';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
      setError(signInError.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!formData.email) {
      setError('Enter your email first to receive a password reset link.');
      return;
    }

    setResetLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, { redirectTo });

    if (resetError) {
      setError(resetError.message || 'Could not send reset email.');
      setResetLoading(false);
      return;
    }

    setMessage('Password reset link sent to your email.');
    setResetLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F7FA] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-4rem] top-12 h-40 w-40 rounded-full bg-[#1A73E8]/20 blur-3xl sm:h-56 sm:w-56" />
        <div className="absolute bottom-8 right-[-3rem] h-48 w-48 rounded-full bg-[#00BFA5]/20 blur-3xl sm:h-64 sm:w-64" />
      </div>

      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full bg-[#EAF3FE] px-4 py-1 text-sm font-medium text-[#1A73E8]">
            Welcome back
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1A1A2E]">
            Log in to your calm space
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#1A1A2E]/70">
            Continue journaling, tracking your mood, and checking in with your mental wellness companion.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1A1A2E]">Email</span>
            <input
              className="w-full rounded-2xl border border-[#CFE4FF] bg-white px-4 py-3 text-[#1A1A2E] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-[#EAF3FE]"
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
            <span className="mb-2 block text-sm font-medium text-[#1A1A2E]">Password</span>
            <input
              className="w-full rounded-2xl border border-[#BFEAE3] bg-white px-4 py-3 text-[#1A1A2E] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#E6F7F4]"
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
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm font-medium text-[#1A73E8] hover:text-[#1557AD] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resetLoading ? 'Sending reset link...' : 'Forgot Password?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#CFE4FF] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#1A1A2E]/70">
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-[#1A73E8] transition hover:text-[#1557AD]" href="/signup">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
