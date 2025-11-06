import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { clearPlansCache } from '@/lib/stripe';
import { validateStripePrice, isValidStripePriceIdFormat } from '@/lib/stripe-validator';

// PUT /api/admin/plans/[id] - Update plan (admin only)
export async function PUT(request, { params }) {
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

    // Await params in Next.js 15
    const { id } = await params;
    const body = await request.json();

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id: id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Determine the final price and stripePriceId (either from update or existing)
    const finalPrice = body.price !== undefined ? parseInt(body.price) : existingPlan.price;
    const finalStripePriceId = body.stripePriceId !== undefined ? body.stripePriceId : existingPlan.stripePriceId;

    // Validate Stripe Price ID format (if being updated)
    if (body.stripePriceId !== undefined && body.stripePriceId && body.stripePriceId.trim() !== '') {
      if (!isValidStripePriceIdFormat(body.stripePriceId)) {
        return NextResponse.json(
          { error: 'Invalid Stripe Price ID format. Must start with "price_"' },
          { status: 400 }
        );
      }
    }

    // Validate Stripe price matches database price (if either price or stripePriceId is being updated)
    if (body.price !== undefined || body.stripePriceId !== undefined) {
      const priceValidation = await validateStripePrice(finalStripePriceId, finalPrice);
      if (!priceValidation.valid) {
        return NextResponse.json(
          { 
            error: 'Stripe price validation failed', 
            details: priceValidation.error,
            actualStripeAmount: priceValidation.actualAmount,
            expectedAmount: finalPrice,
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseInt(body.price);
    if (body.stripePriceId !== undefined) updateData.stripePriceId = body.stripePriceId;
    if (body.maxSites !== undefined) updateData.maxSites = parseInt(body.maxSites);
    if (body.maxTeamMembers !== undefined) updateData.maxTeamMembers = parseInt(body.maxTeamMembers);
    if (body.minCheckInterval !== undefined) updateData.minCheckInterval = parseInt(body.minCheckInterval);
    if (body.maxAICredits !== undefined) updateData.maxAICredits = parseInt(body.maxAICredits);
    if (body.allowedChannels !== undefined) updateData.allowedChannels = body.allowedChannels;
    if (body.features !== undefined) updateData.features = JSON.stringify(body.features);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPopular !== undefined) updateData.isPopular = body.isPopular;
    if (body.sortOrder !== undefined) updateData.sortOrder = parseInt(body.sortOrder);

    // Update plan
    const plan = await prisma.plan.update({
      where: { id: id },
      data: updateData,
    });

    // Clear cache after updating plan
    clearPlansCache();
    console.log('[Admin] Plan cache cleared after updating plan:', plan.name);

    return NextResponse.json({
      success: true,
      plan: {
        ...plan,
        features: JSON.parse(plan.features),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/plans/[id] - Delete plan (admin only)
export async function DELETE(request, { params }) {
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

    // Await params in Next.js 15
    const { id } = await params;

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id: id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if plan is being used by any subscriptions
    const subscriptionsUsingPlan = await prisma.subscription.count({
      where: { plan: existingPlan.name },
    });

    if (subscriptionsUsingPlan > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete plan',
          details: `${subscriptionsUsingPlan} subscription(s) are currently using this plan. Please migrate users first.`
        },
        { status: 400 }
      );
    }

    // Delete plan
    await prisma.plan.delete({
      where: { id: id },
    });

    // Clear cache after deleting plan
    clearPlansCache();
    console.log('[Admin] Plan cache cleared after deleting plan:', existingPlan.name);

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan', details: error.message },
      { status: 500 }
    );
  }
}
