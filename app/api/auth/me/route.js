import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return user data (password already excluded by authenticate)
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}
