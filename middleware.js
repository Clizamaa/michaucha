import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicPaths = ['/login', '/register'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isApiAuth = pathname.startsWith('/api/auth');

  if (isPublic || isApiAuth) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
