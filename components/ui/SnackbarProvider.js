"use client";
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const SnackbarContext = createContext();

export function useSnackbar() {
  return useContext(SnackbarContext);
}

const ICONS = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <AlertTriangle className="w-5 h-5" />,
};

const COLORS = {
  success: 'bg-green-500/90',
  error: 'bg-red-500/90',
  warning: 'bg-yellow-500/90',
  info: 'bg-blue-500/90',
};

export function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState(null);

  const showSnackbar = useCallback((message, severity = 'info', duration = 3000) => {
    setSnackbar({ message, severity });
    setTimeout(() => setSnackbar(null), duration);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <div className={`fixed top-6 right-6 z-50 ${COLORS[snackbar.severity]} text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-2`}>
          {ICONS[snackbar.severity]}
          <span>{snackbar.message}</span>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}
