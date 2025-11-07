import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/crypto';

// POST /api/auth/reset-password - Reset password using token
export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    // Find password reset record
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    // Update user password
    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: await hashPassword(password) },
    });
    // Delete password reset record
    await prisma.passwordReset.delete({ where: { token } });
    return NextResponse.json({ message: 'Password reset successful' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
