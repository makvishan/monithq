"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [apiCalled, setApiCalled] = useState(false);

  useEffect(() => {
    if (apiCalled) return;
    setApiCalled(true);
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      Promise.resolve().then(() => {
        setStatus('error');
        setMessage('Verification token is missing.');
      });
      return;
    }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified! You may now use all features.');
          await refreshUser();
          setTimeout(() => router.push('/settings'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed.');
      });
  }, [router, refreshUser, apiCalled]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        {status === 'verifying' && <p className="text-lg">Verifying your email...</p>}
        {status === 'success' && <p className="text-green-600 text-lg font-semibold">{message}</p>}
        {status === 'error' && <p className="text-red-600 text-lg font-semibold">{message}</p>}
        {(status === 'success' || status === 'error') && (
          <p className="text-xs text-muted-foreground mt-2">You will be redirected shortly...</p>
        )}
      </div>
    </div>
  );
}
