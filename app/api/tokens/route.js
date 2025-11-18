import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/api-middleware';
import { randomBytes } from 'crypto';

// Generate a secure API token
function generateApiToken() {
  return randomBytes(32).toString('hex');
}

// GET /api/tokens - List all API tokens for the current user
export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tokens = await prisma.apiToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null, // Only active tokens
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        token: false, // Don't return the actual token
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
        siteId: true,
        site: {
          select: {
            name: true,
            url: true,
          },
        },
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error fetching API tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API tokens' },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Create a new API token
export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, siteId, expiresInDays } = body;

    // Validate inputs
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Token name is required' },
        { status: 400 }
      );
    }

    // If siteId is provided, verify the user owns the site
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: {
          id: siteId,
          createdById: user.id,
        },
      });

      if (!site) {
        return NextResponse.json(
          { error: 'Site not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    // Generate token
    const token = generateApiToken();

    // Calculate expiration date if specified
    let expiresAt = null;
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create token in database
    const apiToken = await prisma.apiToken.create({
      data: {
        name,
        token,
        userId: user.id,
        siteId: siteId || null,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        token: true, // Return token only on creation
        createdAt: true,
        expiresAt: true,
        siteId: true,
      },
    });

    return NextResponse.json({
      message: 'API token created successfully',
      token: apiToken.token,
      tokenInfo: {
        id: apiToken.id,
        name: apiToken.name,
        createdAt: apiToken.createdAt,
        expiresAt: apiToken.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating API token:', error);
    return NextResponse.json(
      { error: 'Failed to create API token' },
      { status: 500 }
    );
  }
}

// DELETE /api/tokens - Revoke an API token
export async function DELETE(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // Verify the token belongs to the user
    const token = await prisma.apiToken.findFirst({
      where: {
        id: tokenId,
        userId: user.id,
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found or unauthorized' },
        { status: 404 }
      );
    }

    // Revoke the token (soft delete)
    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      message: 'API token revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API token:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API token' },
      { status: 500 }
    );
  }
}
