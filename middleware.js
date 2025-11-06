import { NextResponse } from 'next/server';

/**
 * Middleware for route protection
 * This runs on the server before the page is rendered
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login'];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, we'll handle auth on the client side with ProtectedRoute component
  // This middleware just ensures the route exists
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
