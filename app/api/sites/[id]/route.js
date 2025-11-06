import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess, createAuditLog } from '@/lib/api-middleware';
import { getPlanLimits } from '@/lib/stripe';

// GET /api/sites/[id] - Get single site
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        incidents: {
          orderBy: {
            startTime: 'desc',
          },
          take: 10,
        },
        checks: {
          orderBy: {
            checkedAt: 'desc',
          },
          take: 100,
        },
        _count: {
          select: {
            incidents: true,
            checks: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, site.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ site }, { status: 200 });
  } catch (error) {
    console.error('Get site error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}

// PUT /api/sites/[id] - Update site
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const body = await request.json();

    // Get existing site
    const existingSite = await prisma.site.findUnique({
      where: { id },
    });

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, existingSite.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validate check interval against plan limits if being changed
    if (body.checkInterval !== undefined) {
      const org = await prisma.organization.findUnique({
        where: { id: existingSite.organizationId },
        include: { subscription: true },
      });
      
      const subscription = org?.subscription;
      const planLimits = await getPlanLimits(subscription?.plan || 'FREE');
      
      if (body.checkInterval < planLimits.minCheckInterval) {
        return NextResponse.json(
          {
            error: `Check interval too fast for ${subscription?.plan || 'FREE'} plan`,
            minInterval: planLimits.minCheckInterval,
            requested: body.checkInterval,
            message: `${subscription?.plan || 'FREE'} plan allows minimum ${planLimits.minCheckInterval}s intervals. Upgrade for faster monitoring.`,
          },
          { status: 403 }
        );
      }
    }

    // Update site
    const site = await prisma.site.update({
      where: { id },
      data: {
        name: body.name,
        url: body.url,
        checkInterval: body.checkInterval,
        region: body.region,
        enabled: body.enabled,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog('update', 'site', id, user.id, body, request);

    return NextResponse.json({ site }, { status: 200 });
  } catch (error) {
    console.error('Update site error:', error);
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[id] - Delete site
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get existing site
    const existingSite = await prisma.site.findUnique({
      where: { id },
    });

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, existingSite.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete site (cascades to incidents, checks, etc.)
    await prisma.site.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog('delete', 'site', id, user.id, null, request);

    return NextResponse.json(
      { message: 'Site deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete site error:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}
