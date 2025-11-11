import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/resend';
import { nanoid } from 'nanoid';

// POST /api/auth/verify-email - send verification email
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 200 });
    }
    // Generate token
    const token = nanoid(32);
    // Save token to user (or create a separate verification table if preferred)
    await prisma.user.update({
      where: { email },
      data: { verificationToken: token, verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000) }, // 1 hour expiry
    });
    // Send verification email
    await sendEmail(email, 'verifyEmail', {
      token,
      name: user.name,
    });
    return NextResponse.json({ message: 'Verification email sent' }, { status: 200 });
  } catch (error) {
    console.error('Send verification email error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}

// GET /api/auth/verify-email?token=... - verify email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }
    // Find user by token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationTokenExpires: null },
    });
    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}
