import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess, createAuditLog } from '@/lib/api-middleware';
import { notifyIncidentUpdated, notifyIncidentResolved } from '@/lib/pusher-server';
import { notifyTeamOfResolution } from '@/lib/resend';

// GET /api/incidents/[id] - Get incident details
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    let id = params?.id;
    // Fallback: extract id from URL if params is missing or Proxy
    if (!id || typeof id !== 'string') {
      const urlParts = request.url.split('/');
      id = urlParts[urlParts.length - 1];
      console.log('Fallback id from URL:', id);
    }
    if (!id) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        site: {
          include: {
            organization: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, incident.site.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ incident }, { status: 200 });
  } catch (error) {
    console.error('Get incident error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}

// PUT /api/incidents/[id] - Update incident
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    let id = params?.id;
    // Fallback: extract id from URL if params is missing or Proxy
    if (!id || typeof id !== 'string') {
      const urlParts = request.url.split('/');
      id = urlParts[urlParts.length - 1];
      console.log('Fallback id from URL:', id);
    }
    if (!id) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }
    const body = await request.json();

    // Get existing incident
    const existingIncident = await prisma.incident.findUnique({
      where: { id },
      include: {
        site: true,
      },
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, existingIncident.site.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update incident
    const updateData = {
      status: body.status,
      severity: body.severity,
      aiSummary: body.aiSummary,
    };

    // If resolving, set end time and duration
    if (body.status === 'RESOLVED' && !existingIncident.endTime) {
      const endTime = new Date();
      updateData.endTime = endTime;
      updateData.duration = endTime - existingIncident.startTime;
      updateData.resolvedById = user.id;
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog('update', 'incident', id, user.id, body, request);

    // Broadcast WebSocket notification
    if (body.status === 'RESOLVED') {
      notifyIncidentResolved(incident, existingIncident.site.organizationId);
      
      // Send email notifications to team members who opted in
      await notifyTeamOfResolution(incident, existingIncident.site);
    } else {
      notifyIncidentUpdated(incident, existingIncident.site.organizationId);
    }

    return NextResponse.json({ incident }, { status: 200 });
  } catch (error) {
    console.error('Update incident error:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}
