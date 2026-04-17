import { NextResponse } from 'next/server';
import { createMiddlewareClient } from './lib/supabase/middleware';

export async function proxy(request) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isPublicRoute = isAuthPage || pathname.startsWith('/auth/callback');
  const isProtectedRoute = !isPublicRoute;

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/chat).*)'],
};
