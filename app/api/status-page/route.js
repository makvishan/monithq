import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/api-middleware';

// GET /api/status-page - Get organization's status page configuration
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const statusPage = await prisma.statusPage.findUnique({
      where: {
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json({ statusPage }, { status: 200 });
  } catch (error) {
    console.error('Get status page error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status page' },
      { status: 500 }
    );
  }
}

// POST /api/status-page - Create status page
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { slug, title, description, logoUrl, isPublic, showUptime, showIncidents } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: 'Slug and title are required' },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingPage = await prisma.statusPage.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 400 }
      );
    }

    // Create status page
    const statusPage = await prisma.statusPage.create({
      data: {
        slug,
        title,
        description,
        logoUrl,
        isPublic: isPublic ?? true,
        showUptime: showUptime ?? true,
        showIncidents: showIncidents ?? true,
        organizationId: user.organizationId,
      },
    });

    // Create audit log
    await createAuditLog('create', 'statusPage', statusPage.id, user.id, { slug, title }, request);

    return NextResponse.json({ statusPage }, { status: 201 });
  } catch (error) {
    console.error('Create status page error:', error);
    return NextResponse.json(
      { error: 'Failed to create status page' },
      { status: 500 }
    );
  }
}

// PUT /api/status-page - Update status page
export async function PUT(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { title, description, logoUrl, isPublic, showUptime, showIncidents } = body;

    const statusPage = await prisma.statusPage.findUnique({
      where: { organizationId: user.organizationId },
    });

    if (!statusPage) {
      return NextResponse.json(
        { error: 'Status page not found' },
        { status: 404 }
      );
    }

    // Update status page
    const updatedPage = await prisma.statusPage.update({
      where: { id: statusPage.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(typeof isPublic === 'boolean' && { isPublic }),
        ...(typeof showUptime === 'boolean' && { showUptime }),
        ...(typeof showIncidents === 'boolean' && { showIncidents }),
      },
    });

    // Create audit log
    await createAuditLog('update', 'statusPage', statusPage.id, user.id, body, request);

    return NextResponse.json({ statusPage: updatedPage }, { status: 200 });
  } catch (error) {
    console.error('Update status page error:', error);
    return NextResponse.json(
      { error: 'Failed to update status page' },
      { status: 500 }
    );
  }
}

// DELETE /api/status-page - Delete status page
export async function DELETE(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const statusPage = await prisma.statusPage.findUnique({
      where: { organizationId: user.organizationId },
    });

    if (!statusPage) {
      return NextResponse.json(
        { error: 'Status page not found' },
        { status: 404 }
      );
    }

    await prisma.statusPage.delete({
      where: { id: statusPage.id },
    });

    // Create audit log
    await createAuditLog('delete', 'statusPage', statusPage.id, user.id, { slug: statusPage.slug }, request);

    return NextResponse.json(
      { message: 'Status page deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete status page error:', error);
    return NextResponse.json(
      { error: 'Failed to delete status page' },
      { status: 500 }
    );
  }
}
