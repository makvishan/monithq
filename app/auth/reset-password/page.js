"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Lock, ArrowLeft, Check } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("Failed to reset password. Please try again.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4 text-foreground">Invalid or missing token</h2>
            <p className="text-muted-foreground mb-6">Please use the link sent to your email.</p>
            <Link href="/auth/forgot-password" className="text-primary hover:underline">Request new reset link</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-10 h-10 gradient-ai rounded-lg flex items-center justify-center glow-ai">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-2xl font-bold gradient-text">MonitHQ</span>
        </Link>
        <Card>
          <div className="p-8">
            {!success ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Set a new password</h1>
                  <p className="text-muted-foreground">Enter your new password below.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
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
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
                <div className="mt-6">
                  <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Password reset successful</h2>
                <p className="text-muted-foreground mb-6">You can now log in with your new password.</p>
                <Link href="/auth/login" className="block w-full px-4 py-2 text-center text-sm text-primary font-medium hover:underline transition-colors">Go to login</Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
