import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { stripe, getPlan } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { plan } = body;

    // Get plan from database
    const planData = await getPlan(plan);
    
    // Validate plan
    if (!planData || plan === 'FREE') {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const priceId = planData.stripePriceId;
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Get user's organization
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
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const organization = userWithOrg.organization;

    // Check if already has a paid subscription
    if (
      organization.subscription && 
      organization.subscription.status === 'ACTIVE' && 
      organization.subscription.stripeSubscriptionId &&
      organization.subscription.plan !== 'FREE'
    ) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription. Please manage your subscription from the billing page.' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let customerId = organization.subscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: organization.name,
        metadata: {
          organizationId: organization.id,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: [
        'card',
      ],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/billing?success=true`,
      cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        organizationId: organization.id,
        userId: user.id,
        plan,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    }, { status: 200 });

  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
