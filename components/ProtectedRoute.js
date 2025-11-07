'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { canAccessRoute, getDefaultRedirect } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Higher-Order Component for route protection
 * Wraps pages that require authentication and authorization
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(`/auth/login`);
        return;
      }
      const canAccess = canAccessRoute(pathname, user.role);
      if (!canAccess) {
        const defaultPath = getDefaultRedirect(user.role);
        router.replace(defaultPath);
        return;
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
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
