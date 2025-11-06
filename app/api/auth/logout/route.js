import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate, createAuditLog } from '@/lib/api-middleware';

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get token from request
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.substring(7);

    if (token) {
      // Delete session
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token,
        },
      });
    }

    // Create audit log
    await createAuditLog('logout', 'user', user.id, user.id, null, request);

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear token cookie
    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
