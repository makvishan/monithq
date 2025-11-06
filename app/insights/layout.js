'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function InsightsLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
