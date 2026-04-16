import { NextResponse } from 'next/server';
import { createMiddlewareClient } from './lib/supabase/middleware';

export async function proxy(request) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/mood-tracker/:path*', '/journal/:path*', '/chat/:path*'],
};
