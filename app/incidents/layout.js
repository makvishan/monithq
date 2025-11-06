'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function IncidentsLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
