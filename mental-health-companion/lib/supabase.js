import { createBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function createClient() {
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getSupabaseConfig();

  return createBrowserClient(url, anonKey);
}

export async function createServerClient() {
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createSSRServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export function createMiddlewareClient(request) {
  const { supabaseUrl: url, supabaseAnonKey: anonKey } = getSupabaseConfig();
  let response = NextResponse.next({
    request,
  });

  const supabase = createSSRServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}
