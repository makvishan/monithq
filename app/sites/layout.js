'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function SitesLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
