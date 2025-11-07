'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserInfo() {
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (!currentUser) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="px-4 py-2 bg-card border border-border rounded-lg shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
