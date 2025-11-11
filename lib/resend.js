// Resend email service (Vercel-compatible)
import { Resend } from "resend";
import prisma from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const templates = {
  passwordReset: (data) => ({
    subject: `Reset your MonitHQ password`,
    html: `<div style="font-family: Arial, sans-serif;">
      <h2>Reset your MonitHQ password</h2>
      <p>Hello${data.name ? ` ${data.name}` : ''},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${data.token}" style="background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>Thanks,<br/>MonitHQ Team</p>
    </div>`,
  }),

  verifyEmail: (data) => ({
    subject: `Verify your email address for MonitHQ`,
    html: `<div style="font-family: Arial, sans-serif;">
      <h2>Verify your Email Address</h2>
      <p>Hello${data.name ? ` ${data.name}` : ''},</p>
      <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
      <p style="margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${data.token}" style="background: #10b981; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email</a>
      </p>
      <p>If you did not sign up, you can safely ignore this email.</p>
      <p>Thanks,<br/>MonitHQ Team</p>
    </div>`,
  }),
  incidentCreated: (incident, site) => ({
    subject: `🚨 Incident Alert: ${
      site.name
    } is ${incident.status.toLowerCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
            .badge-high { background: #fee2e2; color: #dc2626; }
            .badge-medium { background: #fef3c7; color: #d97706; }
            .badge-low { background: #dbeafe; color: #2563eb; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New Incident Detected</h1>
            </div>
            <div class="content">
              <h2>${site.name}</h2>
              <p><strong>URL:</strong> ${site.url}</p>
              <p><strong>Status:</strong> ${incident.status}</p>
              <p><strong>Severity:</strong> <span class="badge badge-${incident.severity.toLowerCase()}">${
      incident.severity
    }</span></p>
              <p><strong>Started:</strong> ${new Date(
                incident.startTime
              ).toLocaleString()}</p>
              ${
                incident.aiSummary
                  ? `<p><strong>AI Summary:</strong> ${incident.aiSummary}</p>`
                  : ""
              }
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/incidents" class="button">View Incident Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  incidentResolved: (incident, site) => ({
    subject: `✅ Resolved: ${site.name} incident resolved`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Incident Resolved</h1>
            </div>
            <div class="content">
              <h2>${site.name}</h2>
              <p>The incident has been resolved and the site is back online.</p>
              <p><strong>Duration:</strong> ${Math.round(
                incident.duration / 60000
              )} minutes</p>
              <p><strong>Resolved:</strong> ${new Date(
                incident.endTime
              ).toLocaleString()}</p>
              ${
                incident.aiSummary
                  ? `<p><strong>Summary:</strong> ${incident.aiSummary}</p>`
                  : ""
              }
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/incidents" class="button">View Incident History</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  teamInvite: (email, inviterName, organizationName, role, token) => ({
    subject: `You've been invited to join ${organizationName} on MonitHQ`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👋 Team Invitation</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on MonitHQ as a <strong>${role}</strong>.</p>
              <p>MonitHQ helps teams monitor their websites 24/7 with AI-powered insights and instant alerts.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?invite=${
      token || ""
    }&email=${encodeURIComponent(email)}" class="button">Accept Invitation</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Subscription & Payment Email Templates
  subscriptionCreated: (data) => ({
    subject: `🎉 Welcome to ${data.planName} Plan - Your MonitHQ Subscription is Active`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .plan-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .feature { padding: 8px 0; }
            .feature::before { content: "✓ "; color: #10b981; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ${data.planName}!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Thank you for subscribing to MonitHQ! Your <strong>${data.planName}</strong> plan is now active.</p>
              
              <div class="plan-box">
                <h3>${data.planName} Plan - ${data.amount}</h3>
                <p><strong>Billing Cycle:</strong> ${data.billingCycle}</p>
                <p><strong>Next Billing Date:</strong> ${data.nextBillingDate}</p>
              </div>

              <h3>What's Included:</h3>
              <div class="feature">Monitor up to ${data.maxSites} websites</div>
              <div class="feature">Check interval: ${data.checkInterval}</div>
              <div class="feature">Team members: ${data.maxTeamMembers}</div>
              <div class="feature">Notification channels: ${data.channels}</div>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Get Started</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Need help? <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing">Manage your subscription</a> or contact support.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentSucceeded: (data) => ({
    subject: `✅ Payment Received - Invoice ${data.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 1.2em; color: #10b981; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Received</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>We've successfully processed your payment. Thank you for your continued subscription to MonitHQ!</p>
              
              <div class="invoice-box">
                <h3>Invoice #${data.invoiceNumber}</h3>
                <div class="invoice-row">
                  <span>Date:</span>
                  <span>${data.date}</span>
                </div>
                <div class="invoice-row">
                  <span>Plan:</span>
                  <span>${data.planName}</span>
                </div>
                <div class="invoice-row">
                  <span>Billing Period:</span>
                  <span>${data.billingPeriod}</span>
                </div>
                <div class="invoice-row total">
                  <span>Total Paid:</span>
                  <span>${data.amount}</span>
                </div>
              </div>

              <p><strong>Next billing date:</strong> ${data.nextBillingDate}</p>
              
              ${
                data.invoiceUrl
                  ? `<a href="${data.invoiceUrl}" class="button">Download Invoice</a>`
                  : ""
              }
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL
                }/billing">View billing history</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentFailed: (data) => ({
    subject: `⚠️ Payment Failed - Action Required`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>We were unable to process your payment for your MonitHQ ${
                data.planName
              } subscription.</p>
              
              <div class="warning-box">
                <h3>⚠️ Action Required</h3>
                <p><strong>Amount Due:</strong> ${data.amount}</p>
                <p><strong>Reason:</strong> ${
                  data.failureReason || "Payment method declined"
                }</p>
                <p>Please update your payment method to avoid service interruption.</p>
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>We'll automatically retry the payment in a few days</li>
                <li>If payment continues to fail, your subscription may be suspended</li>
                <li>Update your payment method now to avoid any interruption</li>
              </ul>
              
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/billing" class="button">Update Payment Method</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Need help? Contact our support team.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  subscriptionCanceled: (data) => ({
    subject: `Subscription Canceled - We're Sorry to See You Go`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Canceled</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Your MonitHQ ${data.planName} subscription has been canceled as requested.</p>
              
              <div class="info-box">
                <h3>What This Means:</h3>
                <p><strong>Access Until:</strong> ${data.accessUntil}</p>
                <p>You'll continue to have full access to your ${data.planName} features until ${data.accessUntil}.</p>
                <p>After that, your account will be downgraded to the FREE plan.</p>
              </div>

              <h3>FREE Plan Includes:</h3>
              <ul>
                <li>Monitor up to 3 websites</li>
                <li>5-minute check intervals</li>
                <li>Email notifications</li>
                <li>Basic monitoring features</li>
              </ul>
              
              <p>Changed your mind? You can reactivate your subscription anytime.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" class="button">Reactivate Subscription</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                We'd love to hear your feedback. <a href="mailto:support@makvishan.com">Let us know</a> how we can improve.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  subscriptionRenewal: (data) => ({
    subject: `✅ Subscription Renewed - ${data.planName} Plan`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .renewal-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Subscription Renewed</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Your MonitHQ ${data.planName} subscription has been successfully renewed.</p>
              
              <div class="renewal-box">
                <h3>Renewal Details:</h3>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Amount Charged:</strong> ${data.amount}</p>
                <p><strong>Billing Period:</strong> ${data.billingPeriod}</p>
                <p><strong>Next Renewal:</strong> ${data.nextRenewalDate}</p>
              </div>

              <p>Thank you for continuing to trust MonitHQ with your website monitoring needs!</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="button">View Billing Details</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Questions? <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing">Manage your subscription</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  subscriptionExpiring: (data) => ({
    subject: `⏰ Your Subscription Expires in ${data.daysLeft} Days`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Subscription Expiring Soon</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Your MonitHQ ${data.planName} subscription will expire in <strong>${data.daysLeft} days</strong>.</p>
              
              <div class="warning-box">
                <h3>⚠️ Important Information</h3>
                <p><strong>Expiration Date:</strong> ${data.expirationDate}</p>
                <p>After expiration, your account will be downgraded to the FREE plan with limited features.</p>
              </div>

              <h3>What You'll Lose:</h3>
              <ul>
                <li>Monitoring for ${data.currentSites} websites (FREE: 3 only)</li>
                <li>Advanced notification channels</li>
                <li>Faster check intervals</li>
                <li>Team collaboration features</li>
              </ul>
              
              <p><strong>Don't lose your premium features!</strong> Renew now to continue monitoring all your websites.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="button">Renew Subscription</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Questions? <a href="mailto:support@makvishan.com">Contact support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  planUpgraded: (data) => ({
    subject: `🚀 Plan Upgraded to ${data.newPlan} - New Features Unlocked!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .upgrade-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .feature { padding: 8px 0; }
            .feature::before { content: "✨ "; color: #8b5cf6; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Plan Upgraded!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Great news! Your plan has been upgraded from <strong>${
                data.oldPlan
              }</strong> to <strong>${data.newPlan}</strong>.</p>
              
              <div class="upgrade-box">
                <h3>New Features Unlocked:</h3>
                <div class="feature">Monitor up to ${
                  data.maxSites
                } websites</div>
                <div class="feature">Check interval: ${data.checkInterval}</div>
                <div class="feature">Team members: ${data.maxTeamMembers}</div>
                <div class="feature">Notification channels: ${
                  data.channels
                }</div>
                ${
                  data.aiCredits !== "Unlimited"
                    ? `<div class="feature">AI Credits: ${data.aiCredits}</div>`
                    : '<div class="feature">Unlimited AI-powered insights</div>'
                }
              </div>

              <p>Your new features are active immediately. Start using them now!</p>
              
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard" class="button">Explore New Features</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL
                }/billing">View billing details</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, template, data) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured, skipping email send");
    return { success: false, message: "Email service not configured" };
  }

  try {
    let emailContent;

    // Handle different template types
    if (template === "teamInvite") {
      emailContent = templates[template](
        data.email,
        data.inviterName,
        data.organizationName,
        data.role,
        data.token
      );
    } else if (template === "passwordReset") {
      emailContent = templates.passwordReset(data);
    } else if (
      [
        "subscriptionCreated",
        "paymentSucceeded",
        "paymentFailed",
        "subscriptionCanceled",
        "subscriptionRenewal",
        "subscriptionExpiring",
        "planUpgraded",
      ].includes(template)
    ) {
      // Payment and subscription templates receive data object directly
      emailContent = templates[template](data);
    } else {
      emailContent = templates[template](data, data.site || data);
    }

    await resend.emails.send({
      from: "MonitHQ <info@monithq.com>", // Change to your verified domain
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`Email sent: ${template} to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: error.message };
  }
};

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
        // TODO: Implement Slack notification
        console.log(
          `Would send Slack notification to ${member.email} (URL: ${member.slackWebhookUrl})`
        );
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
        // TODO: Implement Webhook notification
        console.log(`Would send Webhook to ${member.customWebhookUrl}`);
        sentChannels.webhook++;
        memberSentCount++;
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
        // TODO: Implement Slack notification
        console.log(
          `Would send Slack resolution to ${member.email} (URL: ${member.slackWebhookUrl})`
        );
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
        // TODO: Implement Webhook notification
        console.log(
          `Would send Webhook resolution to ${member.customWebhookUrl}`
        );
        sentChannels.webhook++;
        memberSentCount++;
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

// Helper function to format amount
const formatAmount = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

// Helper function to format plan features
const formatPlanFeatures = (planLimits) => {
  const features = {
    maxSites:
      planLimits.maxSites === 999999 ? "Unlimited" : planLimits.maxSites,
    checkInterval:
      planLimits.minCheckInterval < 60
        ? `${planLimits.minCheckInterval} seconds`
        : `${Math.floor(planLimits.minCheckInterval / 60)} minute${
            Math.floor(planLimits.minCheckInterval / 60) > 1 ? "s" : ""
          }`,
    maxTeamMembers:
      planLimits.maxTeamMembers === 999999
        ? "Unlimited"
        : planLimits.maxTeamMembers,
    channels: planLimits.allowedChannels?.join(", ") || "Email",
    aiCredits:
      planLimits.maxAICredits === 999999
        ? "Unlimited"
        : planLimits.maxAICredits,
  };
  return features;
};

const resendExports = {
  sendEmail,
  notifyTeamOfIncident,
  notifyTeamOfResolution,
  formatAmount,
  formatPlanFeatures,
};
export default resendExports;
