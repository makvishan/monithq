import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
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
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const subscription = userWithOrg.organization.subscription;

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${request.headers.get('origin')}/billing`,
    });

    return NextResponse.json({
      url: portalSession.url,
    }, { status: 200 });

  } catch (error) {
    console.error('Create portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session', details: error.message },
      { status: 500 }
    );
  }
}
