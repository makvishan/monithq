"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, logout as apiLogout } from '@/lib/auth';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  refreshUser: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await refreshUser();
    })();
    // Optionally, add event listeners for login/logout if needed
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      refreshUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
