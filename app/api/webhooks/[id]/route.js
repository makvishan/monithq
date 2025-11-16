import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess, createAuditLog } from '@/lib/api-middleware';

// PUT /api/webhooks/[id] - Update webhook
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    // Await params in Next.js 15+
    const { id } = await params;
    const body = await request.json();
    const { name, url, events, isActive } = body;

    // Get webhook to check ownership
    const webhook = await prisma.webhook.findUnique({
      where: { id: id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const hasAccess = await checkOrganizationAccess(user, webhook.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to update this webhook' },
        { status: 403 }
      );
    }

    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(events && { events }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    // Create audit log
    await createAuditLog('update', 'webhook', id, user.id, body, request);

    return NextResponse.json({ webhook: updatedWebhook }, { status: 200 });
  } catch (error) {
    console.error('Update webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks/[id] - Delete webhook
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    // Await params in Next.js 15+
    const { id } = await params;

    // Get webhook to check ownership
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const hasAccess = await checkOrganizationAccess(user, webhook.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this webhook' },
        { status: 403 }
      );
    }

    // Delete webhook
    await prisma.webhook.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog('delete', 'webhook', id, user.id, { name: webhook.name }, request);

    return NextResponse.json(
      { message: 'Webhook deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
