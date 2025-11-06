'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number with Gradient */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
              <h2 className="text-3xl font-bold text-foreground">Page Not Found</h2>
            </div>
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <p className="text-lg text-muted-foreground mb-2">
              Oops! The page you're looking for doesn't exist.
            </p>
            <p className="text-muted-foreground">
              It might have been moved, deleted, or the URL might be incorrect.
            </p>
          </motion.div>

          {/* Animated Robot/Monitor Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="w-32 h-32 mx-auto gradient-ai rounded-full flex items-center justify-center glow-ai">
              <Search className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-all inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>

            {/* Home Button */}
            <Link
              href="/"
              className="px-6 py-3 gradient-ai text-white rounded-lg font-medium hover:opacity-90 transition-all glow-ai inline-flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 pt-8 border-t border-border"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Or try one of these popular pages:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/sites"
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
              >
                Sites
              </Link>
              <Link
                href="/insights"
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
              >
                AI Insights
              </Link>
              <Link
                href="/billing"
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
              >
                Billing
              </Link>
            </div>
          </motion.div>

          {/* Search Suggestion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <p className="text-xs text-muted-foreground">
              Need help? Contact us at{' '}
              <a
                href="mailto:support@monithq.com"
                className="text-primary hover:underline"
              >
                support@monithq.com
              </a>
            </p>
          </motion.div>
        </motion.div>

        {/* Floating Particles Effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 left-10 w-32 h-32 gradient-ai rounded-full blur-3xl opacity-30"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl opacity-30"
          />
        </div>
      </div>
    </div>
  );
}
