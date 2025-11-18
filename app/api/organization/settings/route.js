import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { USER_ROLES } from '@/lib/constants';

// GET - Fetch organization alert settings (Org Admin and Super Admin)
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Check if user is Admin or Super Admin
    if (user.role !== USER_ROLES.ORG_ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get user with organization
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            alertThreshold: true,
            alertCooldownMinutes: true,
            maintenanceMode: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    return NextResponse.json(userData.organization);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization settings' },
      { status: 500 }
    );
  }
}

// PUT - Update organization alert settings (Org Admin and Super Admin)
export async function PUT(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Check if user is Admin or Super Admin
    if (user.role !== USER_ROLES.ORG_ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get user with organization
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { alertThreshold, alertCooldownMinutes, maintenanceMode, name, logo } = body;

    // Validate inputs
    const updates = {};

    if (alertThreshold !== undefined) {
      if (typeof alertThreshold !== 'number' || alertThreshold < 1 || alertThreshold > 10) {
        return NextResponse.json(
          { error: 'alertThreshold must be a number between 1 and 10' },
          { status: 400 }
        );
      }
      updates.alertThreshold = alertThreshold;
    }

    if (alertCooldownMinutes !== undefined) {
      if (typeof alertCooldownMinutes !== 'number' || alertCooldownMinutes < 5 || alertCooldownMinutes > 120) {
        return NextResponse.json(
          { error: 'alertCooldownMinutes must be a number between 5 and 120' },
          { status: 400 }
        );
      }
      updates.alertCooldownMinutes = alertCooldownMinutes;
    }

    if (maintenanceMode !== undefined) {
      if (typeof maintenanceMode !== 'boolean') {
        return NextResponse.json(
          { error: 'maintenanceMode must be a boolean' },
          { status: 400 }
        );
      }
      updates.maintenanceMode = maintenanceMode;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 2) {
        return NextResponse.json(
          { error: 'Organization name must be a string with at least 2 characters' },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (logo !== undefined) {
      if (logo && typeof logo !== 'string') {
        return NextResponse.json(
          { error: 'Logo must be a string (S3 URL)' },
          { status: 400 }
        );
      }
      updates.logo = logo;
    }

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: userData.organizationId },
      data: updates,
    });

    return NextResponse.json({
      message: 'Organization settings updated successfully',
      organization,
    });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to update organization settings' },
      { status: 500 }
    );
  }
}
