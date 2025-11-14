import { NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, getPlanByPriceId, getPlanLimits } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { formatAmount } from '@/lib/utils';
import { formatInterval } from '@/lib/utils';

async function getRawBody(request) {
  const chunks = [];
  const reader = request.body.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request) {
  try {
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_CONFIG.webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session) {
  const { customer, subscription, metadata } = session;

  console.log('[Stripe] Checkout completed:', {
    customer,
    subscription,
    organizationId: metadata.organizationId,
  });

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription);

  await prisma.subscription.upsert({
    where: {
      organizationId: metadata.organizationId,
    },
    create: {
      organizationId: metadata.organizationId,
      plan: metadata.plan,
      status: 'ACTIVE',
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      amount: stripeSubscription.items.data[0].price.unit_amount,
      currency: stripeSubscription.currency.toUpperCase(),
    },
    update: {
      plan: metadata.plan,
      status: 'ACTIVE',
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      amount: stripeSubscription.items.data[0].price.unit_amount,
      currency: stripeSubscription.currency.toUpperCase(),
    },
  });

  console.log('[Stripe] Subscription created for organization:', metadata.organizationId);

  // Send welcome email
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: metadata.organizationId },
      include: {
        users: {
          where: { role: { in: ['OWNER', 'ADMIN'] } },
          take: 1,
        },
      },
    });

    if (organization && organization.users.length > 0) {
      const user = organization.users[0];
      const planLimits = await getPlanLimits(metadata.plan);
      


      await sendEmail(user.email, 'subscriptionCreated', {
        userName: user.name,
        planName: metadata.plan,
        amount: formatAmount(stripeSubscription.items.data[0].price.unit_amount, stripeSubscription.currency),
        billingCycle: 'Monthly',
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString(),
        maxSites: planLimits.maxSites === 999999 ? 'Unlimited' : planLimits.maxSites,
        checkInterval: formatInterval(planLimits.minCheckInterval),
        maxTeamMembers: planLimits.maxTeamMembers === 999999 ? 'Unlimited' : planLimits.maxTeamMembers,
        channels: planLimits.allowedChannels?.join(', ') || 'Email',
      });

      console.log('[Email] Welcome email sent to:', user.email);
    }
  } catch (emailError) {
    console.error('[Email] Failed to send welcome email:', emailError);
  }
}

async function handleSubscriptionUpdated(subscription) {
  const { customer, id, status, current_period_end, cancel_at_period_end, items } = subscription;

  console.log('[Stripe] Subscription updated:', { subscriptionId: id, status });

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customer },
    include: {
      organization: {
        include: {
          users: {
            where: { role: { in: ['OWNER', 'ADMIN'] } },
            take: 1,
          },
        },
      },
    },
  });

  if (!existingSubscription) {
    console.warn('[Stripe] No subscription found for customer:', customer);
    return;
  }

  const oldPlan = existingSubscription.plan;

  const statusMap = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'PAST_DUE',
    incomplete: 'PAST_DUE',
  };

  // Get plan name from price ID (in case plan was changed in Stripe dashboard)
  const priceId = items.data[0].price.id;
  const planData = await getPlanByPriceId(priceId);
  const updateData = {
    status: statusMap[status] || 'ACTIVE',
    currentPeriodEnd: new Date(current_period_end * 1000),
    cancelAtPeriodEnd: cancel_at_period_end,
    amount: items.data[0].price.unit_amount,
  };
  
  // Update plan if we found a matching plan in database
  const newPlan = planData ? planData.name : oldPlan;
  if (planData) {
    updateData.plan = newPlan;
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: updateData,
  });

  console.log('[Stripe] Subscription updated in database');

  // Send plan upgrade/change email if plan changed
  if (oldPlan !== newPlan && existingSubscription.organization?.users.length > 0) {
    try {
      const user = existingSubscription.organization.users[0];
      const planLimits = await getPlanLimits(newPlan);
      


      await sendEmail(user.email, 'planUpgraded', {
        userName: user.name,
        oldPlan: oldPlan,
        newPlan: newPlan,
        maxSites: planLimits.maxSites === 999999 ? 'Unlimited' : planLimits.maxSites,
        checkInterval: formatInterval(planLimits.minCheckInterval),
        maxTeamMembers: planLimits.maxTeamMembers === 999999 ? 'Unlimited' : planLimits.maxTeamMembers,
        channels: planLimits.allowedChannels?.join(', ') || 'Email',
        aiCredits: planLimits.maxAICredits === 999999 ? 'Unlimited' : formatAmount(planLimits.maxAICredits, 'USD'),
      });

      console.log('[Email] Plan upgrade email sent to:', user.email);
    } catch (emailError) {
      console.error('[Email] Failed to send plan upgrade email:', emailError);
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  const { customer, id, current_period_end } = subscription;

  console.log('[Stripe] Subscription deleted:', id);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customer },
    include: {
      organization: {
        include: {
          users: {
            where: { role: { in: ['OWNER', 'ADMIN'] } },
            take: 1,
          },
        },
      },
    },
  });

  if (!existingSubscription) {
    console.warn('[Stripe] No subscription found for customer:', customer);
    return;
  }

  const oldPlan = existingSubscription.plan;

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: 'CANCELED',
      plan: 'FREE',
    },
  });

  console.log('[Stripe] Subscription downgraded to FREE');

  // Send cancellation email
  if (existingSubscription.organization?.users.length > 0) {
    try {
      const user = existingSubscription.organization.users[0];
      const accessUntil = current_period_end 
        ? new Date(current_period_end * 1000).toLocaleDateString()
        : new Date().toLocaleDateString();

      await sendEmail(user.email, 'subscriptionCanceled', {
        userName: user.name,
        planName: oldPlan,
        accessUntil: accessUntil,
      });

      console.log('[Email] Cancellation email sent to:', user.email);
    } catch (emailError) {
      console.error('[Email] Failed to send cancellation email:', emailError);
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  const { subscription, amount_paid, currency, number, created, period_start, period_end, hosted_invoice_url } = invoice;

  console.log('[Stripe] Invoice payment succeeded');

  if (subscription) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
    
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription },
      include: {
        organization: {
          include: {
            users: {
              where: { role: { in: ['OWNER', 'ADMIN'] } },
              take: 1,
            },
          },
        },
      },
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      // Send payment success email
      if (existingSubscription.organization?.users.length > 0) {
        try {
          const user = existingSubscription.organization.users[0];
          

          const startDate = new Date(period_start * 1000).toLocaleDateString();
          const endDate = new Date(period_end * 1000).toLocaleDateString();

          await sendEmail(user.email, 'paymentSucceeded', {
            userName: user.name,
            invoiceNumber: number || `INV-${created}`,
            date: new Date(created * 1000).toLocaleDateString(),
            planName: existingSubscription.plan,
            amount: formatAmount(amount_paid, currency),
            billingPeriod: `${startDate} - ${endDate}`,
            nextBillingDate: new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString(),
            invoiceUrl: hosted_invoice_url,
          });

          console.log('[Email] Payment success email sent to:', user.email);
        } catch (emailError) {
          console.error('[Email] Failed to send payment success email:', emailError);
        }
      }
    }
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const { subscription, amount_due, currency, last_finalization_error } = invoice;

  console.log('[Stripe] Invoice payment failed');

  if (subscription) {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription },
      include: {
        organization: {
          include: {
            users: {
              where: { role: { in: ['OWNER', 'ADMIN'] } },
              take: 1,
            },
          },
        },
      },
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'PAST_DUE',
        },
      });

      // Send payment failed email
      if (existingSubscription.organization?.users.length > 0) {
        try {
          const user = existingSubscription.organization.users[0];
          

          await sendEmail(user.email, 'paymentFailed', {
            userName: user.name,
            planName: existingSubscription.plan,
            amount: formatAmount(amount_due, currency),
            failureReason: last_finalization_error?.message || 'Payment method declined',
          });

          console.log('[Email] Payment failed email sent to:', user.email);
        } catch (emailError) {
          console.error('[Email] Failed to send payment failed email:', emailError);
        }
      }
    }
  }
}
