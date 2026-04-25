'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client.js';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }

    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center dark:bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#CFE4FF] border-t-[#1A73E8] animate-spin" />
        <h1 className="text-2xl font-semibold text-[#1A73E8] mb-2">Serenity</h1>
        <p className="text-gray-600 dark:text-gray-400">Loading your wellness journey...</p>
      </div>
    </main>
  );
}
