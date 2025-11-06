import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrgAdmin, createAuditLog } from '@/lib/api-middleware';
import { USER_ROLES } from '@/lib/constants';

// DELETE /api/organizations/team/[userId] - Remove team member
export async function DELETE(request, { params }) {
  try {
    const user = await requireOrgAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Await params in Next.js 15+
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user to be removed
    const memberToRemove = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!memberToRemove) {
      // Check if it's a pending invitation
      const invitation = await prisma.invitation.findUnique({
        where: { id: userId },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: 'User or invitation not found' },
          { status: 404 }
        );
      }

      // Check if invitation belongs to the same organization
      if (invitation.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      // Delete the invitation
      await prisma.invitation.delete({
        where: { id: userId },
      });

      // Audit log
      await createAuditLog('remove', 'invitation', userId, user.id, { email: invitation.email }, request);

      return NextResponse.json(
        { message: 'Invitation removed successfully' },
        { status: 200 }
      );
    }

    // Check if user is in the same organization
    if (memberToRemove.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Cannot remove yourself
    if (memberToRemove.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      );
    }

    // Cannot remove another org admin
    if (memberToRemove.role === USER_ROLES.ORG_ADMIN) {
      return NextResponse.json(
        { error: 'Cannot remove organization admin' },
        { status: 400 }
      );
    }

    // Delete user (cascades to their sessions, sites, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    await createAuditLog('remove', 'user', userId, user.id, { email: memberToRemove.email }, request);

    return NextResponse.json(
      { message: 'Team member removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
