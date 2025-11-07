import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOrgAdmin, createAuditLog } from '@/lib/api-middleware';
import { generateInviteToken, getTokenExpiry } from '@/lib/crypto';
import { sendEmail } from '@/lib/resend';
import { getPlanLimits } from '@/lib/stripe';
import { USER_ROLES } from '@/lib/constants';

// POST /api/organizations/team/invite - Send invitation
export async function POST(request) {
  try {
    const user = await requireOrgAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { email, role } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists globally
    const alreadyRegistered = await prisma.user.findUnique({
      where: { email },
    });
    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'User with this email is already registered' },
        { status: 400 }
      );
    }

    // Check team member limit based on subscription
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: { 
        subscription: true,
        users: { select: { id: true } }
      },
    });

    const subscription = organization?.subscription;
    const planLimits = await getPlanLimits(subscription?.plan || 'FREE');
    const currentMemberCount = organization?.users?.length || 0;

    // Check if can add more team members (-1 means unlimited)
    if (planLimits.maxTeamMembers !== -1 && currentMemberCount >= planLimits.maxTeamMembers) {
      return NextResponse.json(
        {
          error: `Team member limit reached for ${subscription?.plan || 'FREE'} plan`,
          limit: planLimits.maxTeamMembers,
          current: currentMemberCount,
          message: `${subscription?.plan || 'FREE'} plan allows up to ${planLimits.maxTeamMembers} team members. Upgrade to add more members.`,
        },
        { status: 403 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
        accepted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role || USER_ROLES.USER,
        token: generateInviteToken(),
        expiresAt: getTokenExpiry(7),
        organizationId: user.organizationId,
      },
      include: {
        organization: true,
      },
    });

    // Send invitation email
    try {
      await sendEmail(email, 'teamInvite', {
        email,
        inviterName: user.name || user.email,
        organizationName: invitation.organization.name,
        role: invitation.role,
        token: invitation.token,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    // Audit log
    await createAuditLog('invite', 'user', invitation.id, user.id, { email, role }, request);

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
