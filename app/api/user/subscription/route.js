import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { stripe, getPlanLimits } from '@/lib/stripe';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization with subscription
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!userWithOrg?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const org = userWithOrg.organization;
    const subscription = org.subscription;

    // If no subscription, return free plan
    if (!subscription || !subscription.stripeSubscriptionId) {
      const planLimits = await getPlanLimits('FREE');
      
      return NextResponse.json({
        subscription: {
          plan: 'FREE',
          status: 'ACTIVE',
          currentPeriodEnd: null,
          usage: {
            sites: await prisma.site.count({ where: { organizationId: org.id } }),
            aiCredits: 0,
          },
          paymentMethod: null,
          billingHistory: [],
          planLimits, // Include plan limits for FREE plan
        },
      });
    }

    // Fetch subscription details from Stripe
    let stripeSubscription = null;
    let paymentMethod = null;
    let invoices = [];

    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      
      // Get payment method
      if (stripeSubscription.default_payment_method) {
        paymentMethod = await stripe.paymentMethods.retrieve(
          stripeSubscription.default_payment_method
        );
      }

      // Get billing history (last 10 invoices)
      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 10,
      });

      invoices = stripeInvoices.data.map((invoice) => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        description: invoice.lines.data[0]?.description || 'Subscription',
        amount: invoice.amount_paid,
        status: invoice.status === 'paid' ? 'paid' : invoice.status === 'open' ? 'pending' : 'failed',
        invoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      }));
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
    }

    // Get usage stats
    const siteCount = await prisma.site.count({ where: { organizationId: org.id } });

    // Get plan limits
    const planName = subscription.plan || 'FREE';
    const planLimits = await getPlanLimits(planName);

    // Map status
    const statusMap = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'PAST_DUE',
    };

    return NextResponse.json({
      subscription: {
        plan: planName,
        status: statusMap[stripeSubscription?.status] || 'ACTIVE',
        currentPeriodEnd: stripeSubscription?.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
        usage: {
          sites: siteCount,
          aiCredits: 0, // TODO: Implement AI credits tracking
        },
        paymentMethod: paymentMethod
          ? {
              brand: paymentMethod.card?.brand || 'Card',
              last4: paymentMethod.card?.last4 || '0000',
              expiryMonth: paymentMethod.card?.exp_month || 12,
              expiryYear: paymentMethod.card?.exp_year || 2025,
            }
          : null,
        billingHistory: invoices,
        planLimits, // Include plan limits
      },
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error.message },
      { status: 500 }
    );
  }
}
