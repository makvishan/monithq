import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/api-middleware';
import crypto from 'crypto';

// GET /api/webhooks - List all webhooks for user's organization
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const webhooks = await prisma.webhook.findMany({
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

    return NextResponse.json({ webhooks }, { status: 200 });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create new webhook
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { name, url, events, useSecret } = body;

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Name, URL, and events are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate secret if requested
    const secret = useSecret ? crypto.randomBytes(32).toString('hex') : null;

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events,
        secret,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    });

    // Create audit log
    await createAuditLog('create', 'webhook', webhook.id, user.id, { name, url, events }, request);

    return NextResponse.json({ webhook, secret }, { status: 201 });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
