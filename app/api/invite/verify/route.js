import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/invite/verify?token=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing invite token.' }, { status: 400 });
  }
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });
  if (!invitation || invitation.accepted || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite.' }, { status: 400 });
  }
  return NextResponse.json({
    organizationName: invitation.organization.name,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  });
}
