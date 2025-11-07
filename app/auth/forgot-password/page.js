'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Mail, ArrowLeft, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        setError(data.error || "Failed to send reset link.");
      }
    } catch {
      setError("Failed to send reset link. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-10 h-10 gradient-ai rounded-lg flex items-center justify-center glow-ai">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-2xl font-bold gradient-text">MonitHQ</span>
        </Link>

        <Card>
          <div className="p-8">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Reset your password</h1>
                  <p className="text-muted-foreground">
                    Enter your email and we'll send you a link to reset your password
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                  <button
                    type="submit"
                    className="w-full px-4 py-3 gradient-ai text-white rounded-lg font-semibold hover:opacity-90 transition-all glow-ai"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="mt-6">
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </Link>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
                <p className="text-muted-foreground mb-6">
                  We've sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="w-full px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Try Different Email
                  </button>
                  <Link
                    href="/auth/login"
                    className="block w-full px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to login
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Help Text */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Need help?{' '}
          <Link href="/support" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
