import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/api-middleware';

// GET /api/admin/subscriptions - Get all subscriptions across all organizations
export async function GET(request) {
  try {
    const user = await requireSuperAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    const where = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                users: true,
                sites: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0) / 100; // Convert cents to dollars

    // Get counts by status
    const stats = {
      total: await prisma.subscription.count(),
      active: await prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      past_due: await prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      canceled: await prisma.subscription.count({ where: { status: 'CANCELED' } }),
      mrr,
    };

    return NextResponse.json({ 
      subscriptions,
      stats,
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
