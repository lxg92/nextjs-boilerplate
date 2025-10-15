import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../lib/redis';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/api/tts',
    '/api/recordings',
    '/api/user',
    '/api/stripe',
    '/dashboard',
  ];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    const sessionId = request.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      // Redirect to login for API routes, return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/api/auth/login', request.url));
      }
    }
    
    // Validate session in Redis
    return getSession(sessionId).then(sessionData => {
      if (!sessionData) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        } else {
          return NextResponse.redirect(new URL('/api/auth/login', request.url));
        }
      }
      
      // Session is valid, continue to the requested page
      return NextResponse.next();
    }).catch(() => {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Session validation failed' }, { status: 500 });
      } else {
        return NextResponse.redirect(new URL('/api/auth/login', request.url));
      }
    });
  }
  
  // For non-protected routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


