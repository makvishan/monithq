import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/api-middleware';

// GET /api/admin/users - Get all users across all organizations
export async function GET(request) {
  try {
    const user = await requireSuperAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const organizationId = searchParams.get('organizationId');

    const where = {};
    if (role) where.role = role;
    if (organizationId) where.organizationId = organizationId;

    const users = await prisma.user.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get counts
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return NextResponse.json({ 
      users,
      stats: {
        total: totalUsers,
        active: activeUsers,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
