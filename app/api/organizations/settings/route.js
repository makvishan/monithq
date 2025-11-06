import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrgAdmin, createAuditLog } from '@/lib/api-middleware';

// GET /api/organizations/settings - Get organization settings
export async function GET(request) {
  try {
    const user = await requireOrgAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization }, { status: 200 });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization settings' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/settings - Update organization settings
export async function PUT(request) {
  try {
    const user = await requireOrgAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { name, logo } = body;

    const organization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name,
        logo,
      },
    });

    // Audit log
    await createAuditLog('update', 'organization', organization.id, user.id, body, request);

    return NextResponse.json({ organization }, { status: 200 });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization settings' },
      { status: 500 }
    );
  }
}
