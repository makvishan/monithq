'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Loader2, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [plans, setPlans] = useState([]);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans?active=true');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setFetchingPlans(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.subscription?.plan || 'FREE');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setCurrentPlan('FREE');
    }
  };

  const handleSubscribe = async (planName) => {
    if (planName === 'FREE') {
      router.push('/dashboard');
      return;
    }

    setLoading(planName);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message);
      setLoading(null);
    }
  };

  if (fetchingPlans) {
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
        <button
          onClick={() => router.push('/billing')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Billing</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Pricing Plans</h1>
            <p className="text-muted-foreground">Choose the perfect plan for your monitoring needs</p>
          </div>
        </div>

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

        {/* Pricing Cards */}
        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {plans
            .filter((plan) => {
              // Hide FREE plan if user has an active paid subscription
              if (plan.name === 'FREE' && currentPlan && currentPlan !== 'FREE') {
                return false;
              }
              return true;
            })
            .map((plan) => {
            const isPopular = plan.isPopular;
            const isCurrent = currentPlan === plan.name;
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isCurrent
                    ? 'border-green-500 shadow-lg ring-2 ring-green-500'
                    : isPopular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Current Plan
                    </span>
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plan.displayName}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-foreground">
                      {plan.price === 0 ? 'Free' : formatAmount(plan.price, 'usd')}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                      >
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={loading === plan.name || isCurrent}
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {loading === plan.name
                      ? 'Loading...'
                      : isCurrent
                      ? 'Current Plan'
                      : plan.name === 'FREE'
                      ? 'Get Started'
                      : 'Subscribe Now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include 30-day money-back guarantee. Cancel anytime.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Need custom enterprise solution?{' '}
            <a href="mailto:sales@monithq.com" className="text-primary hover:underline">
              Contact sales
            </a>
          </p>
        </div>
      </MainContent>
    </div>
  );
}
