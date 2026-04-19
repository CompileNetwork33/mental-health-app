'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client.js';

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
    setMessage('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message || 'Could not create account.');
      setLoading(false);
      return;
    }

    setMessage('Account created successfully! Please check your email to verify your account.');
    
    setTimeout(() => {
      router.push('/login');
      router.refresh();
    }, 2000);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F7FA] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-4rem] top-10 h-44 w-44 rounded-full bg-[#1A73E8]/20 blur-3xl sm:h-60 sm:w-60" />
        <div className="absolute bottom-6 left-[-3rem] h-48 w-48 rounded-full bg-[#00BFA5]/20 blur-3xl sm:h-64 sm:w-64" />
      </div>

      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full bg-[#E6F7F4] px-4 py-1 text-sm font-medium text-[#00BFA5]">
            Begin your journey
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1A1A2E]">
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#1A1A2E]/70">
            Save your reflections, track patterns, and build a gentle routine for your mental well-being.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1A1A2E]">Name</span>
            <input
              className="w-full rounded-2xl border border-[#CFE4FF] bg-white px-4 py-3 text-[#1A1A2E] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-[#EAF3FE]"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1A1A2E]">Email</span>
            <input
              className="w-full rounded-2xl border border-[#BFEAE3] bg-white px-4 py-3 text-[#1A1A2E] outline-none transition focus:border-[#00BFA5] focus:ring-4 focus:ring-[#E6F7F4]"
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
              className="w-full rounded-2xl border border-[#CFE4FF] bg-white px-4 py-3 text-[#1A1A2E] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-[#EAF3FE]"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#CFE4FF] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#1A1A2E]/70">
          Already have an account?{' '}
          <Link className="font-semibold text-[#1A73E8] transition hover:text-[#1557AD]" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
