import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Verify site exists and user has access
    const site = await prisma.site.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Fetch checks ordered by most recent
    const checks = await prisma.siteCheck.findMany({
      where: {
        siteId: id,
      },
      orderBy: {
        checkedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        status: true,
        responseTime: true,
        statusCode: true,
        errorMessage: true,
        checkedAt: true,
      },
    });

    return NextResponse.json({ 
      success: true,
      checks,
      total: checks.length,
    });

  } catch (error) {
    console.error('Error fetching site checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checks' },
      { status: 500 }
    );
  }
}
