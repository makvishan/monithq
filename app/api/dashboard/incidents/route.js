import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/dashboard/incidents - Get limited recent incidents for dashboard display
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const status = searchParams.get('status') || 'INVESTIGATING'; // Default to active incidents

    // Build where clause based on user role
    const where = {
      status,
    };

    if (user.role !== 'SUPER_ADMIN') {
      // Regular users see only their org's incidents
      where.site = {
        organizationId: user.organizationId,
      };
    }

    // Fetch limited incidents with minimal data for dashboard cards
    const incidents = await prisma.incident.findMany({
      where,
      take: limit,
      orderBy: {
        startTime: 'desc',
      },
      select: {
        id: true,
        status: true,
        severity: true,
        startTime: true,
        endTime: true,
        duration: true,
        aiSummary: true,
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

    // Add computed fields for better dashboard display
    const incidentsWithMetrics = incidents.map(incident => ({
      ...incident,
      isOngoing: !incident.endTime,
      isResolved: incident.status === 'RESOLVED',
      isCritical: incident.severity === 'HIGH' || incident.severity === 'CRITICAL',
    }));

    return NextResponse.json({
      success: true,
      incidents: incidentsWithMetrics,
      total: incidents.length,
      limit,
      status,
    });

  } catch (error) {
    console.error('Error fetching dashboard incidents:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard incidents',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
