import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/api-middleware';
import crypto from 'crypto';

// Generate a secure API key
function generateApiKey() {
  return 'mk_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/api-keys - List all API keys for user's organization
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/api-keys - Create new API key
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { name, expiresAt } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate API key
    const key = generateApiKey();

    // Create API key
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        organizationId: user.organizationId,
        createdById: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Create audit log
    await createAuditLog('create', 'apiKey', apiKey.id, user.id, { name }, request);

    // Return the key (this is the only time it will be shown in full)
    return NextResponse.json({ apiKey, key }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
