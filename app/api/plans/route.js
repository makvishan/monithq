import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const plans = await prisma.plan.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { sortOrder: 'asc' },
    });

    // Parse features JSON
    const parsedPlans = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features),
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
