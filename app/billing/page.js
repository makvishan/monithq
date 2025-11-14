'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Crown, 
  CreditCard, 
  Check, 
  Loader2,
  Download,
  Lock,
  ExternalLink,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';

export default function BillingPage() {
  const router = useRouter();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingPageContent router={router} />
    </Suspense>
  );
}

function BillingPageContent({ router }) {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const mockSubscription = {
      plan: 'STARTER',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usage: {
        sites: 3,
        aiCredits: 750,
      },
      paymentMethod: {
        brand: 'Visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
      },
      billingHistory: [
        { id: 1, date: '2024-12-01', description: 'Starter Plan - Monthly', amount: 2900, status: 'paid' },
        { id: 2, date: '2024-11-01', description: 'Starter Plan - Monthly', amount: 2900, status: 'paid' },
        { id: 3, date: '2024-10-01', description: 'Starter Plan - Monthly', amount: 2900, status: 'paid' },
      ],
    };
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans?active=true');
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription || mockSubscription);
        } else {
          setSubscription(mockSubscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        setSubscription(mockSubscription);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
    fetchSubscription();
  }, [searchParams]);




  // Find current plan from database
  useEffect(() => {
    if (plans.length > 0 && subscription) {
      const plan = plans.find(p => p.name === subscription.plan);
      if (plan) {
        setCurrentPlan(plan);
      } else {
        // Default to FREE plan
        setCurrentPlan(plans.find(p => p.name === 'FREE') || plans[0]);
      }
    }
  }, [plans, subscription]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create portal session');
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      setError(error.message);
      setPortalLoading(false);
    }
  };

  const handleViewInvoice = (invoice) => {
    if (invoice.invoiceUrl) {
      // Open invoice in a new window for viewing
      window.open(invoice.invoiceUrl, '_blank', 'width=1000,height=800');
    }
  };

  const handleDownloadInvoice = (invoice) => {
    if (invoice.invoicePdf) {
      const link = document.createElement('a');
      link.href = invoice.invoicePdf;
      link.download = `invoice-${invoice.id}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const planLimits = currentPlan ? {
    sites: currentPlan.maxSites,
    aiCredits: currentPlan.maxAICredits
  } : { sites: 1, aiCredits: 100 };
  
  const usage = subscription?.usage || { sites: 0, aiCredits: 0 };
  const sitesPercent = planLimits.sites === -1 ? 0 : (usage.sites / planLimits.sites) * 100;
  const creditsPercent = planLimits.aiCredits === -1 ? 0 : (usage.aiCredits / planLimits.aiCredits) * 100;

  const getStatusBadge = (status, cancelAtPeriodEnd) => {
    // If subscription is active but canceling, show different badge
    if (status === 'ACTIVE' && cancelAtPeriodEnd) {
      return { label: 'Canceling', class: 'gradient-warning' };
    }
    
    const badges = {
      ACTIVE: { label: 'Active', class: 'gradient-success' },
      CANCELED: { label: 'Canceled', class: 'gradient-danger' },
      PAST_DUE: { label: 'Past Due', class: 'gradient-warning' },
    };
    return badges[status] || badges.ACTIVE;
  };

  const statusBadge = getStatusBadge(subscription?.status || 'ACTIVE', subscription?.cancelAtPeriodEnd);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and payment details</p>
          </div>
        </div>

        {showSuccess && (
          <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <div className="text-green-500 font-medium">
                Subscription activated successfully! Welcome aboard 🎉
              </div>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="text-red-500 font-medium">
                {error}
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {subscription?.cancelAtPeriodEnd && (
          <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 flex items-start gap-3 mb-6">
            <div className="w-5 h-5 text-yellow-500 mt-0.5">⚠️</div>
            <div>
              <div className="text-yellow-500 font-semibold mb-1">Subscription Canceling</div>
              <div className="text-yellow-600 text-sm">
                Your subscription will end on{' '}
                <span className="font-semibold">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                . You&apos;ll still have access to all features until then. You can reactivate anytime from the Manage Subscription portal.
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 gradient-success rounded-lg glow-success">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{currentPlan?.displayName || 'Free'} Plan</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.class} text-white`}>
                      {statusBadge.label}
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {formatAmount(currentPlan?.price || 0, 'usd')}
                      <span className="text-sm text-muted-foreground font-normal">/month</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading || subscription?.plan === 'FREE'}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Subscription'}
                </button>
                <button
                  onClick={() => router.push('/pricing')}
                  className="px-4 py-2 rounded-lg gradient-ai text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Active Sites</span>
                  <span className="text-sm font-bold text-foreground">
                    {usage.sites} / {planLimits.sites === -1 ? '∞' : planLimits.sites}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-info transition-all duration-500" style={{ width: `${Math.min(sitesPercent, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">AI Credits</span>
                  <span className="text-sm font-bold text-foreground">
                    {usage.aiCredits} / {planLimits.aiCredits === -1 ? '∞' : planLimits.aiCredits.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-secondary transition-all duration-500" style={{ width: `${Math.min(creditsPercent, 100)}%` }} />
                </div>
              </div>
            </div>

            {subscription?.currentPeriodEnd && subscription?.plan !== 'FREE' && (
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {subscription?.cancelAtPeriodEnd ? (
                    <>
                      Subscription ends: <span className="font-medium text-yellow-600">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </>
                  ) : (
                    <>
                      Next billing date: <span className="font-medium text-foreground">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
                {!subscription?.cancelAtPeriodEnd && (
                  <div className="text-sm text-muted-foreground">
                    Amount: <span className="font-bold text-foreground">{formatAmount(currentPlan?.price || 0, 'usd')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

        {subscription?.paymentMethod && subscription?.plan !== 'FREE' && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 gradient-info rounded-lg glow-info">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Payment Method</h3>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg gradient-info glow-info">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-white" />
                <div className="text-white">
                  <div className="font-semibold">{subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}</div>
                  <div className="text-sm opacity-90">Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}</div>
                </div>
              </div>
              <button onClick={handleManageBilling} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors">
                Update
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Your Plan Includes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPlan?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="p-1 rounded-full gradient-success glow-success">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {subscription?.billingHistory && subscription.billingHistory.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Billing History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscription.billingHistory.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 text-sm text-foreground">
                          {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.description}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground">{formatAmount(invoice.amount, 'usd')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === 'paid' ? 'gradient-success' :
                            invoice.status === 'failed' ? 'gradient-danger' : 'gradient-warning'
                          } text-white`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {invoice.invoiceUrl && (
                              <button
                                onClick={() => handleViewInvoice(invoice)}
                                className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded transition-colors"
                                title="View Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {invoice.invoicePdf && (
                              <button
                                onClick={() => handleDownloadInvoice(invoice)}
                                className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </MainContent>
    </div>
  );
}
