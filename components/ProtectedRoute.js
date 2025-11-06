'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, canAccessRoute, getCurrentUser, getDefaultRedirect } from '@/lib/auth';

/**
 * Higher-Order Component for route protection
 * Wraps pages that require authentication and authorization
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      const authenticated = isAuthenticated();
      const user = getCurrentUser();

      // If not authenticated, redirect to login
      if (!authenticated) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check if user has permission to access this route
      const canAccess = canAccessRoute(pathname, user?.role);

      if (!canAccess) {
        // Redirect to appropriate page based on role
        const defaultPath = getDefaultRedirect(user?.role);
        router.replace(defaultPath);
        return;
      }

      // User is authenticated and has access
      setHasAccess(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [pathname, router]);

  // Show loading state while checking access
  if (isChecking || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
