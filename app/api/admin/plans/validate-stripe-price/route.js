import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { validateStripePrice } from '@/lib/stripe-validator';

// POST /api/admin/plans/validate-stripe-price
// Validates a Stripe price ID and returns price information
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Check if user is super admin
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { stripePriceId, expectedAmount } = body;

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'stripePriceId is required' },
        { status: 400 }
      );
    }

    if (expectedAmount === undefined || expectedAmount === null) {
      return NextResponse.json(
        { error: 'expectedAmount is required' },
        { status: 400 }
      );
    }

    // Validate the Stripe price
    const validation = await validateStripePrice(stripePriceId, parseInt(expectedAmount));

    if (validation.valid) {
      return NextResponse.json({
        valid: true,
        message: `✅ Valid! Stripe price matches $${(validation.actualAmount / 100).toFixed(2)}`,
        actualAmount: validation.actualAmount,
        currency: validation.currency,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        valid: false,
        error: validation.error,
        actualAmount: validation.actualAmount,
        currency: validation.currency,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error validating Stripe price:', error);
    return NextResponse.json(
      { error: 'Failed to validate Stripe price', details: error.message },
      { status: 500 }
    );
  }
}
