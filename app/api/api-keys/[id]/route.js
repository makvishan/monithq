import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess, createAuditLog } from '@/lib/api-middleware';

// DELETE /api/api-keys/[id] - Delete API key
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = params;

    // Get API key to check ownership
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const hasAccess = await checkOrganizationAccess(user, apiKey.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this API key' },
        { status: 403 }
      );
    }

    // Delete API key
    await prisma.apiKey.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog('delete', 'apiKey', id, user.id, { name: apiKey.name }, request);

    return NextResponse.json(
      { message: 'API key deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
