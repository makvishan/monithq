'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function OrgLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
