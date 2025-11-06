import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

// Get user notification settings
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    // Check if requireAuth returned an error response
    if (user instanceof NextResponse) {
      return user;
    }

    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notifyOnIncident: true,
        notifyOnResolution: true,
        notifyOnDegradation: true,
        notifyOnlyAdmins: true,
        siteSubscriptions: {
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
        },
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// Update user notification settings
export async function PUT(request) {
  try {
    const user = await requireAuth(request);
    
    // Check if requireAuth returned an error response
    if (user instanceof NextResponse) {
      return user;
    }
    
    const body = await request.json();

    const {
      notifyOnIncident,
      notifyOnResolution,
      notifyOnDegradation,
      notifyOnlyAdmins,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        notifyOnIncident,
        notifyOnResolution,
        notifyOnDegradation,
        notifyOnlyAdmins,
      },
      select: {
        notifyOnIncident: true,
        notifyOnResolution: true,
        notifyOnDegradation: true,
        notifyOnlyAdmins: true,
      },
    });

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings: updatedUser,
    });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
