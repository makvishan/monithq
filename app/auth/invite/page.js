"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import showToast from "@/lib/toast";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function InviteRegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const emailParam = searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: emailParam,
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    async function verifyInvite() {
      if (!inviteToken) {
        showToast.error("Invalid invite link.");
        router.replace("/auth/login");
        return;
      }
      // Call API to verify token and get org info
      const res = await fetch(`/api/invite/verify?token=${inviteToken}`);
      const data = await res.json();
      if (res.ok && data.organizationName) {
        setOrgName(data.organizationName);
        setInviteValid(true);
      } else {
        showToast.error(data.error || "Invalid or expired invite.");
        router.replace("/auth/login");
      }
      setLoading(false);
    }
    verifyInvite();
  }, [inviteToken, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast.warning("Passwords do not match!");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          inviteToken,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh user context after registration
        await refreshUser();
        showToast.success("Registration successful! Redirecting to dashboard...");
        router.replace("/dashboard");
      } else {
        showToast.error(data.error || "Registration failed.");
      }
    } catch {
      showToast.error("Registration failed. Please try again.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!inviteValid) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-10 h-10 gradient-ai rounded-lg flex items-center justify-center glow-ai">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-2xl font-bold gradient-text">MonitHQ</span>
        </a>

        <Card>
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Accept Invitation</h1>
              <p className="text-muted-foreground">Join <strong>{orgName}</strong> on MonitHQ</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary opacity-70 cursor-not-allowed"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="w-4 h-4 mt-1 rounded border-border text-primary focus:ring-primary" required />
                <span className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </span>
              </label>
              <button
                type="submit"
                className="w-full px-4 py-3 gradient-ai text-white rounded-lg font-semibold hover:opacity-90 transition-all glow-ai inline-flex items-center justify-center gap-2"
              >
                Accept Invitation
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </Card>
        {/* Trust Badge */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Trusted by teams at</p>
          <div className="flex items-center justify-center gap-6 opacity-50">
            <div className="text-xs font-semibold">ACME CORP</div>
            <div className="text-xs font-semibold">TECHCO</div>
            <div className="text-xs font-semibold">STARTUP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
