import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, getTokenExpiry } from '@/lib/crypto';
import { createAuditLog } from '@/lib/api-middleware';
import { USER_ROLES } from '@/lib/constants';

export async function POST(request) {
  try {
  const body = await request.json();
  const { email, password, name, organizationName, inviteToken } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    let result;
    if (inviteToken) {
      // Accepting an invite: find valid invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
        include: { organization: true },
      });
      if (!invitation || invitation.accepted || invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired invitation.' }, { status: 400 });
      }
      // Create user in invited organization with invited role
      result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: USER_ROLES.USER,
            organizationId: invitation.organizationId,
            emailVerified: true,
          },
        });
        // Mark invitation as accepted
        await tx.invitation.update({
          where: { token: inviteToken },
          data: { accepted: true },
        });
        return { user, organization: invitation.organization };
      });
    } else {
      // Normal registration: create new org and user as ORG_ADMIN
      result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName || `${name}'s Organization`,
          },
        });

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: USER_ROLES.ORG_ADMIN,
            organizationId: organization.id,
            emailVerified: false,
          },
        });
        // Create free subscription for the organization
        await tx.subscription.create({
          data: {
            organizationId: organization.id,
            plan: 'FREE',
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        });

        return { user, organization };
      });
    }

    // Generate JWT token
    const token = generateToken({ userId: result.user.id });

    // Create session
    await prisma.session.create({
      data: {
        userId: result.user.id,
        token,
        expiresAt: getTokenExpiry(7),
      },
    });

    // Create audit log
    await createAuditLog('register', 'user', result.user.id, result.user.id, null, request);

    // Return user data and token
    const response = NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          organizationId: result.user.organizationId,
        },
        token,
      },
      { status: 201 }
    );

    // Set token in cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user. Please try again.' },
      { status: 500 }
    );
  }
}
