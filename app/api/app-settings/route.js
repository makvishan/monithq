import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET - Fetch app settings (Super Admin only)
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Verify user is Super Admin
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    // Get or create app settings (single row with id="app_settings")
    let appSettings = await prisma.appSettings.findUnique({
      where: { id: 'app_settings' },
    });

    // If not exists, create default
    if (!appSettings) {
      appSettings = await prisma.appSettings.create({
        data: {
          id: 'app_settings',
          notifyOnManualCheck: false,
        },
      });
    }

    return NextResponse.json(appSettings);
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app settings' },
      { status: 500 }
    );
  }
}

// PUT - Update app settings (Super Admin only)
export async function PUT(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Verify user is Super Admin
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { notifyOnManualCheck } = body;

    // Validate input
    if (typeof notifyOnManualCheck !== 'boolean') {
      return NextResponse.json(
        { error: 'notifyOnManualCheck must be a boolean' },
        { status: 400 }
      );
    }

    // Upsert app settings (create if doesn't exist, update if exists)
    const appSettings = await prisma.appSettings.upsert({
      where: { id: 'app_settings' },
      update: {
        notifyOnManualCheck,
      },
      create: {
        id: 'app_settings',
        notifyOnManualCheck,
      },
    });

    return NextResponse.json({
      message: 'App settings updated successfully',
      settings: appSettings,
    });
  } catch (error) {
    console.error('Error updating app settings:', error);
    return NextResponse.json(
      { error: 'Failed to update app settings' },
      { status: 500 }
    );
  }
}
