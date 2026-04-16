import { NextResponse } from 'next/server';
import { createMiddlewareClient } from './lib/supabase';

const protectedRoutes = ['/dashboard', '/mood-tracker', '/journal', '/chat'];

function isProtectedRoute(pathname) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request) {
  if (!isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

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
