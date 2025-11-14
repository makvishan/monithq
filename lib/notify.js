import prisma from "./prisma";

// Centralized notification utility
import { sendSlackNotification } from './slack.js';
import { sendEmail } from './resend.js';
import { sendApiNotification } from './apiNotify.js';

// import sendSmsNotification from './sms.js'; // Uncomment if SMS implemented
// import sendWebhookNotification from './webhooks.js'; // Uncomment if custom webhook implemented

/**
 * Send notification to one or more channels
 * @param {Object} options
 * @param {string[]} options.channels - Array of channels to notify (e.g., ['email', 'slack'])
 * @param {Object} options.data - Notification data (message, subject, etc.)
 * @param {Object} options.config - Channel config (email, slackWebhookUrl, etc.)
 */
export const notify = async ({ channels, data, config }) => {
  const results = {};

  for (const channel of channels) {
    try {
      if (channel === 'email' && config.email) {
        results.email = await sendEmail(config.email, data.template, data.payload);
      }
      if (channel === 'slack' && config.slackWebhookUrl) {
        results.slack = await sendSlackNotification(config.slackWebhookUrl, data.message);
      }
      // if (channel === 'sms' && config.smsPhoneNumber) {
      //   results.sms = await sendSmsNotification(config.smsPhoneNumber, data.message);
      // }
      // if (channel === 'webhook' && config.customWebhookUrl) {
      //   results.webhook = await sendWebhookNotification(config.customWebhookUrl, data.payload);
      // }
    } catch (err) {
      results[channel] = { success: false, error: err.message };
    }
  }

  return results;
}

// Send incident notification to team members
export const notifyTeamOfIncident = async (incident, site) => {
  try {
    // Determine incident type
    const isDegradation = incident.severity === "MEDIUM";
    const isOffline =
      incident.severity === "HIGH" || incident.severity === "CRITICAL";

    // Get organization subscription to check plan limits
    const organization = await prisma.organization.findUnique({
      where: { id: site.organizationId },
      include: {
        subscription: true,
      },
    });

    const subscription = organization?.subscription;
    const planName = subscription?.plan || "FREE";

    // Get plan limits using getPlanLimits (import from stripe.js)
    const { getPlanLimits } = await import("./stripe");
    const planLimits = await getPlanLimits(planName);
    const allowedChannels = planLimits.allowedChannels || ["email"];

    // Get all team members of the organization with their preferences
    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: site.organizationId,
      },
      select: {
        email: true,
        role: true,
        notifyOnIncident: true,
        notifyOnDegradation: true,
        notifyOnlyAdmins: true,
        // Channel preferences
        notifyViaEmail: true,
        notifyViaSlack: true,
        notifyViaSms: true,
        notifyViaWebhook: true,
        slackWebhookUrl: true,
        smsPhoneNumber: true,
        customWebhookUrl: true,
        siteSubscriptions: {
          where: {
            siteId: site.id,
          },
        },
      },
    });

    let sentCount = 0;
    const sentChannels = { email: 0, slack: 0, sms: 0, webhook: 0 };

    // Filter and send notifications based on preferences
    for (const member of teamMembers) {
      // Check if user wants incident notifications
      if (!member.notifyOnIncident) {
        console.log(
          `Skipping ${member.email}: incident notifications disabled`
        );
        continue;
      }

      // Check degradation preference
      if (isDegradation && !member.notifyOnDegradation) {
        console.log(
          `Skipping ${member.email}: degradation notifications disabled`
        );
        continue;
      }

      // Check admin-only preference
      if (member.notifyOnlyAdmins && member.role === "USER") {
        console.log(
          `Skipping ${member.email}: only admins should receive notifications`
        );
        continue;
      }

      // Check site-specific subscriptions (if any subscriptions exist, user must be subscribed)
      const hasSubscriptions = member.siteSubscriptions.length > 0;
      if (hasSubscriptions) {
        const isSubscribed = member.siteSubscriptions.some(
          (sub) => sub.siteId === site.id
        );
        if (!isSubscribed) {
          console.log(`Skipping ${member.email}: not subscribed to this site`);
          continue;
        }
      }

      let memberSentCount = 0;

      // Send via Email if enabled and allowed
      if (member.notifyViaEmail && allowedChannels.includes("email")) {
        await sendEmail(member.email, "incidentCreated", { ...incident, site });
        sentChannels.email++;
        memberSentCount++;
      }

      // Send via Slack if enabled and allowed
      if (
        member.notifyViaSlack &&
        allowedChannels.includes("slack") &&
        member.slackWebhookUrl
      ) {
        // Compose Slack message
        const slackMsg = `🚨 Incident: ${site.name} is ${incident.status}\nSeverity: ${incident.severity}\n${incident.aiSummary ? `AI Summary: ${incident.aiSummary}\n` : ""}Started: ${new Date(incident.startTime).toLocaleString()}\n${site.url ? `URL: ${site.url}` : ""}`;
        await sendSlackNotification(member.slackWebhookUrl, slackMsg);
        sentChannels.slack++;
        memberSentCount++;
      }

      // Send via SMS if enabled and allowed
      if (
        member.notifyViaSms &&
        allowedChannels.includes("sms") &&
        member.smsPhoneNumber
      ) {
        // TODO: Implement SMS notification
        console.log(`Would send SMS to ${member.smsPhoneNumber}`);
        sentChannels.sms++;
        memberSentCount++;
      }

      // Send via Webhook if enabled and allowed
      if (
        member.notifyViaWebhook &&
        allowedChannels.includes("webhook") &&
        member.customWebhookUrl
      ) {
        // Send Webhook/API notification
        try {
          const webhookPayload = {
            type: 'incident',
            incident,
            site,
            message: `Incident: ${site.name} is ${incident.status}`,
          };
          const webhookResult = await sendApiNotification(member.customWebhookUrl, webhookPayload);
          if (webhookResult.success) {
            sentChannels.webhook++;
            memberSentCount++;
          } else {
            console.error(`Webhook notification failed for ${member.customWebhookUrl}:`, webhookResult.error);
          }
        } catch (err) {
          console.error(`Webhook notification error for ${member.customWebhookUrl}:`, err);
        }
      }

      if (memberSentCount > 0) {
        sentCount++;
      }
    }

    console.log(
      `Sent ${sentCount} incident notifications: ${JSON.stringify(
        sentChannels
      )}`
    );
    return {
      success: true,
      sent: sentCount,
      total: teamMembers.length,
      channels: sentChannels,
    };
  } catch (error) {
    console.error("Error notifying team:", error);
    return { success: false, message: error.message };
  }
};

// Send resolution notification to team members
export const notifyTeamOfResolution = async (incident, site) => {
  try {
    // Get organization subscription to check plan limits
    const organization = await prisma.organization.findUnique({
      where: { id: site.organizationId },
      include: {
        subscription: true,
      },
    });

    const subscription = organization?.subscription;
    const planName = subscription?.plan || "FREE";

    // Get plan limits
    const { getPlanLimits } = await import("./stripe");
    const planLimits = await getPlanLimits(planName);
    const allowedChannels = planLimits.allowedChannels || ["email"];

    // Get all team members of the organization with their preferences
    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: site.organizationId,
      },
      select: {
        email: true,
        role: true,
        notifyOnResolution: true,
        notifyOnlyAdmins: true,
        // Channel preferences
        notifyViaEmail: true,
        notifyViaSlack: true,
        notifyViaSms: true,
        notifyViaWebhook: true,
        slackWebhookUrl: true,
        smsPhoneNumber: true,
        customWebhookUrl: true,
        siteSubscriptions: {
          where: {
            siteId: site.id,
          },
        },
      },
    });

    let sentCount = 0;
    const sentChannels = { email: 0, slack: 0, sms: 0, webhook: 0 };

    // Filter and send notifications based on preferences
    for (const member of teamMembers) {
      // Check if user wants resolution notifications
      if (!member.notifyOnResolution) {
        console.log(
          `Skipping ${member.email}: resolution notifications disabled`
        );
        continue;
      }

      // Check admin-only preference
      if (member.notifyOnlyAdmins && member.role === "USER") {
        console.log(
          `Skipping ${member.email}: only admins should receive notifications`
        );
        continue;
      }

      // Check site-specific subscriptions (if any subscriptions exist, user must be subscribed)
      const hasSubscriptions = member.siteSubscriptions.length > 0;
      if (hasSubscriptions) {
        const isSubscribed = member.siteSubscriptions.some(
          (sub) => sub.siteId === site.id
        );
        if (!isSubscribed) {
          console.log(`Skipping ${member.email}: not subscribed to this site`);
          continue;
        }
      }

      let memberSentCount = 0;

      // Send via Email if enabled and allowed
      if (member.notifyViaEmail && allowedChannels.includes("email")) {
        await sendEmail(member.email, "incidentResolved", {
          ...incident,
          site,
        });
        sentChannels.email++;
        memberSentCount++;
      }

      // Send via Slack if enabled and allowed
      if (
        member.notifyViaSlack &&
        allowedChannels.includes("slack") &&
        member.slackWebhookUrl
      ) {
        // Compose Slack message for resolution
        const slackMsg = `✅ Incident resolved for ${site.name}\nDuration: ${Math.round(incident.duration / 60000)} minutes\nResolved: ${new Date(incident.endTime).toLocaleString()}\n${incident.aiSummary ? `Summary: ${incident.aiSummary}\n` : ""}${site.url ? `URL: ${site.url}` : ""}`;
        await sendSlackNotification(member.slackWebhookUrl, slackMsg);
        sentChannels.slack++;
        memberSentCount++;
      }

      // Send via SMS if enabled and allowed
      if (
        member.notifyViaSms &&
        allowedChannels.includes("sms") &&
        member.smsPhoneNumber
      ) {
        // TODO: Implement SMS notification
        console.log(`Would send SMS resolution to ${member.smsPhoneNumber}`);
        sentChannels.sms++;
        memberSentCount++;
      }

      // Send via Webhook if enabled and allowed
      if (
        member.notifyViaWebhook &&
        allowedChannels.includes("webhook") &&
        member.customWebhookUrl
      ) {
        // Send Webhook/API notification
        try {
          const webhookPayload = {
            type: 'resolution',
            incidentId,
            incident,
            resolvedBy,
            resolvedAt,
            message,
          };
          // Import sendApiNotification utility
          const webhookResult = await sendApiNotification(member.customWebhookUrl, webhookPayload);
          if (webhookResult.success) {
            sentChannels.webhook++;
            memberSentCount++;
          } else {
            console.error(`Webhook notification failed for ${member.customWebhookUrl}:`, webhookResult.error);
          }
        } catch (err) {
          console.error(`Webhook notification error for ${member.customWebhookUrl}:`, err);
        }
      }

      if (memberSentCount > 0) {
        sentCount++;
      }
    }

    console.log(
      `Sent ${sentCount} resolution notifications: ${JSON.stringify(
        sentChannels
      )}`
    );
    return {
      success: true,
      sent: sentCount,
      total: teamMembers.length,
      channels: sentChannels,
    };
  } catch (error) {
    console.error("Error notifying team of resolution:", error);
    return { success: false, message: error.message };
  }
};



