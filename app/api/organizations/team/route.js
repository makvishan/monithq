import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrgAdmin, checkOrganizationAccess, createAuditLog } from '@/lib/api-middleware';
import { getPlanLimits } from '@/lib/stripe';

// GET /api/organizations/team - List team members
export async function GET(request) {
  try {
    const user = await requireOrgAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // SUPER_ADMIN users don't belong to an organization
    // They shouldn't access this endpoint
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Super admins cannot view organization teams' },
        { status: 403 }
      );
    }

    // Get all users in the organization (excluding current user)
    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        id: {
          not: user.id, // Exclude the logged-in user
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get pending invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: user.organizationId,
        accepted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    // Format team members with ACTIVE status
    const activeMembers = teamMembers.map(member => ({
      ...member,
      status: 'ACTIVE',
    }));

    // Format invitations with PENDING status
    const pendingInvites = invitations.map(invite => ({
      id: invite.id,
      name: null,
      email: invite.email,
      role: invite.role,
      avatar: null,
      createdAt: invite.createdAt,
      lastLoginAt: null,
      status: 'PENDING',
      expiresAt: invite.expiresAt,
    }));

    // Combine active members and pending invitations
    const team = [...activeMembers, ...pendingInvites];

    // Get subscription and plan limits
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: { subscription: true },
    });

    const subscription = organization?.subscription;
    const planLimits = await getPlanLimits(subscription?.plan || 'FREE');
    
    // Total members includes current user + active members
    const totalMembers = activeMembers.length + 1; // +1 for current user

    return NextResponse.json({ 
      team,
      teamMembers: activeMembers,
      invitations: pendingInvites,
      limits: {
        current: totalMembers,
        max: planLimits.maxTeamMembers,
        canAddMore: planLimits.maxTeamMembers === -1 || totalMembers < planLimits.maxTeamMembers,
        plan: subscription?.plan || 'FREE',
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
