import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, createAuditLog } from '@/lib/api-middleware';
import { getPlanLimits } from '@/lib/stripe';

// GET /api/users/settings - Get user settings
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Get user with notification preferences
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        // Notification Event Types
        notifyOnIncident: true,
        notifyOnResolution: true,
        notifyOnDegradation: true,
        notifyOnlyAdmins: true,
        // Notification Channels
        notifyViaEmail: true,
        notifyViaSlack: true,
        notifyViaSms: true,
        notifyViaWebhook: true,
        slackWebhookUrl: true,
        smsPhoneNumber: true,
        customWebhookUrl: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        createdAt: userData.createdAt,
      },
      settings: {
        notifications: {
          events: {
            incident: userData.notifyOnIncident,
            resolution: userData.notifyOnResolution,
            degradation: userData.notifyOnDegradation,
            onlyAdmins: userData.notifyOnlyAdmins,
          },
          channels: {
            email: userData.notifyViaEmail,
            slack: userData.notifyViaSlack,
            sms: userData.notifyViaSms,
            webhook: userData.notifyViaWebhook,
          },
          channelConfig: {
            slackWebhookUrl: userData.slackWebhookUrl,
            smsPhoneNumber: userData.smsPhoneNumber,
            customWebhookUrl: userData.customWebhookUrl,
          },
        },
      },
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/users/settings - Update user settings
export async function PUT(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { 
      name, 
      email, 
      notificationChannels, // { email: true, slack: false, sms: false, webhook: false }
      slackWebhookUrl,
      smsPhoneNumber,
      customWebhookUrl,
    } = body;

    // Get user's current role
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true },
    });

    // Regular users (USER role) cannot change their email
    if (email && email !== currentUser.email && currentUser.role === 'USER') {
      return NextResponse.json(
        { error: 'Regular users cannot change their email address. Contact your organization admin.' },
        { status: 403 }
      );
    }

    // Check if email is already taken by another user (only for admins changing email)
    if (email && email !== currentUser.email && (currentUser.role === 'ORG_ADMIN' || currentUser.role === 'SUPER_ADMIN')) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Validate notification channels if being updated
    if (notificationChannels) {
      // Get user's organization and subscription
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          organization: {
            include: {
              subscription: true,
            },
          },
        },
      });

      const subscription = userData?.organization?.subscription;
      const planLimits = await getPlanLimits(subscription?.plan || 'FREE');
      const allowedChannels = planLimits.allowedChannels || ['email'];

      // Check each notification channel
      const channelMap = {
        slack: 'slack',
        sms: 'sms',
        webhook: 'webhook',
      };

      for (const [channelKey, channelId] of Object.entries(channelMap)) {
        if (notificationChannels[channelKey] === true && !allowedChannels.includes(channelId)) {
          return NextResponse.json(
            { 
              error: `${channelId.charAt(0).toUpperCase() + channelId.slice(1)} notifications are not available on your current plan`,
              channel: channelId,
              plan: subscription?.plan || 'FREE',
              requiredPlan: channelId === 'slack' ? 'STARTER' : 'PRO',
            },
            { status: 403 }
          );
        }
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (name) updateData.name = name;
    // Only allow email update for ORG_ADMIN and SUPER_ADMIN
    if (email && (currentUser.role === 'ORG_ADMIN' || currentUser.role === 'SUPER_ADMIN')) {
      updateData.email = email;
    }
    
    // Update notification channel preferences
    if (notificationChannels) {
      if (notificationChannels.email !== undefined) updateData.notifyViaEmail = notificationChannels.email;
      if (notificationChannels.slack !== undefined) updateData.notifyViaSlack = notificationChannels.slack;
      if (notificationChannels.sms !== undefined) updateData.notifyViaSms = notificationChannels.sms;
      if (notificationChannels.webhook !== undefined) updateData.notifyViaWebhook = notificationChannels.webhook;
    }
    
    // Update channel URLs/numbers
    if (slackWebhookUrl !== undefined) updateData.slackWebhookUrl = slackWebhookUrl;
    if (smsPhoneNumber !== undefined) updateData.smsPhoneNumber = smsPhoneNumber;
    if (customWebhookUrl !== undefined) updateData.customWebhookUrl = customWebhookUrl;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notifyViaEmail: true,
        notifyViaSlack: true,
        notifyViaSms: true,
        notifyViaWebhook: true,
        slackWebhookUrl: true,
        smsPhoneNumber: true,
        customWebhookUrl: true,
      },
    });

    // Create audit log
    await createAuditLog('update', 'user', user.id, user.id, body, request);

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
