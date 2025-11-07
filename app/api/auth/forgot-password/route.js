import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, getTokenExpiry } from '@/lib/crypto';
import { sendEmail } from '@/lib/resend';

// POST /api/auth/forgot-password - Request password reset
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' }, { status: 200 });
    }
  // Generate token and expiry
  const token = generateToken({ userId: user.id });
  const expiresAt = getTokenExpiry(1); // 1 day expiry
    // Remove any previous reset tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    // Create new password reset record
    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });
    // Send email
    await sendEmail(email, 'passwordReset', {
      name: user.name,
      email,
      token,
    });
    return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
