import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

// Subscribe to a site
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    // Check if requireAuth returned an error response
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Check if site exists and belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      return NextResponse.json(
        { message: 'Site not found' },
        { status: 404 }
      );
    }

    if (site.organizationId !== user.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.siteSubscription.findUnique({
      where: {
        userId_siteId: {
          userId: user.id,
          siteId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Already subscribed to this site' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await prisma.siteSubscription.create({
      data: {
        userId: user.id,
        siteId,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Successfully subscribed to site',
      subscription,
    });
  } catch (error) {
    console.error('Failed to subscribe to site:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to subscribe to site' },
      { status: 500 }
    );
  }
}

// Unsubscribe from a site
export async function DELETE(request) {
  try {
    const user = await requireAuth(request);
    
    // Check if requireAuth returned an error response
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { message: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Delete subscription
    await prisma.siteSubscription.delete({
      where: {
        userId_siteId: {
          userId: user.id,
          siteId,
        },
      },
    });

    return NextResponse.json({
      message: 'Successfully unsubscribed from site',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }
    console.error('Failed to unsubscribe from site:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to unsubscribe from site' },
      { status: 500 }
    );
  }
}
