import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { clearPlansCache } from '@/lib/stripe';
import { validateStripePrice, isValidStripePriceIdFormat } from '@/lib/stripe-validator';

// GET /api/admin/plans - Get all plans (admin only)
export async function GET(request) {
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

    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Parse features JSON
    const parsedPlans = plans.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
    }));

    return NextResponse.json({ plans: parsedPlans }, { status: 200 });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/plans - Create new plan (admin only)
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
    const { 
      name, 
      displayName, 
      description, 
      price, 
      stripePriceId,
      maxSites,
      maxTeamMembers,
      minCheckInterval,
      maxAICredits,
      allowedChannels,
      features,
      isActive,
      isPopular,
      sortOrder 
    } = body;

    // Validate required fields
    if (!name || !displayName || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, price' },
        { status: 400 }
      );
    }

    // Validate Stripe Price ID format (if provided)
    if (stripePriceId && stripePriceId.trim() !== '' && !isValidStripePriceIdFormat(stripePriceId)) {
      return NextResponse.json(
        { error: 'Invalid Stripe Price ID format. Must start with "price_"' },
        { status: 400 }
      );
    }

    // Validate Stripe price matches database price
    const priceValidation = await validateStripePrice(stripePriceId, parseInt(price));
    if (!priceValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Stripe price validation failed', 
          details: priceValidation.error,
          actualStripeAmount: priceValidation.actualAmount,
          expectedAmount: parseInt(price),
        },
        { status: 400 }
      );
    }

    // Create plan
    const plan = await prisma.plan.create({
      data: {
        name: name.toUpperCase(),
        displayName,
        description: description || '',
        price: parseInt(price),
        stripePriceId: stripePriceId || '',
        maxSites: parseInt(maxSites) || 3,
        maxTeamMembers: parseInt(maxTeamMembers) || 3,
        minCheckInterval: parseInt(minCheckInterval) || 300,
        maxAICredits: parseInt(maxAICredits) || 0,
        allowedChannels: allowedChannels || ['email'],
        features: JSON.stringify(features || []),
        isActive: isActive !== false,
        isPopular: isPopular || false,
        sortOrder: parseInt(sortOrder) || 0,
      },
    });

    // Clear cache after creating plan
    clearPlansCache();
    console.log('[Admin] Plan cache cleared after creating plan:', plan.name);

    return NextResponse.json({
      success: true,
      plan: {
        ...plan,
        features: JSON.parse(plan.features),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan', details: error.message },
      { status: 500 }
    );
  }
}
