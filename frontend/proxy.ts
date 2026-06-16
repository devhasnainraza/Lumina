import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected and public routes
const protectedRoutes = ['/dashboard', '/chat', '/documents', '/settings', '/analytics'];
const authRoutes = ['/login', '/signup'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Skip middleware for public routes and Next.js internals
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Get auth token from cookie
  const authToken = request.cookies.get('auth-token')?.value;

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to chat if accessing auth routes with valid token
  if (isAuthRoute && authToken) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const redirectUrl = redirectParam || '/chat';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
