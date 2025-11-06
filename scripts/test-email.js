#!/usr/bin/env node

/**
 * Email Testing Script
 * 
 * This script tests the Resend email configuration and sends test emails
 * to verify that email delivery is working correctly.
 * 
 * Usage:
 *   node scripts/test-email.js <recipient-email> [template]
 * 
 * Examples:
 *   node scripts/test-email.js your@email.com
 *   node scripts/test-email.js your@email.com teamInvite
 *   node scripts/test-email.js your@email.com incidentCreated
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
};

// Email templates for testing
const testTemplates = {
  teamInvite: (recipientEmail) => ({
  subject: '👋 Team Invitation to MonitHQ (Test Email)',
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
            .test-badge { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👋 Team Invitation</h1>
              <span class="test-badge">TEST EMAIL</span>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>Test User</strong> has invited you to join <strong>Test Organization</strong> on MonitHQ as a <strong>MEMBER</strong>.</p>
              <p>MonitHQ helps teams monitor their websites 24/7 with AI-powered insights and instant alerts.</p>
              <p><em>This is a test email to verify email delivery is working correctly.</em></p>
              <a href="https://example.com" class="button">Accept Invitation</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  incidentCreated: (recipientEmail) => ({
    subject: '🚨 Incident Alert: Test Site is Down (Test Email)',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; background: #fee2e2; color: #dc2626; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .test-badge { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New Incident Detected</h1>
              <span class="test-badge">TEST EMAIL</span>
            </div>
            <div class="content">
              <h2>Test Website</h2>
              <p><strong>URL:</strong> https://example.com</p>
              <p><strong>Status:</strong> INVESTIGATING</p>
              <p><strong>Severity:</strong> <span class="badge">HIGH</span></p>
              <p><strong>Started:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>AI Summary:</strong> Connection timeout detected. Server not responding to health checks.</p>
              <p><em>This is a test email to verify incident notifications are working correctly.</em></p>
              <a href="https://example.com/incidents" class="button">View Incident Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  incidentResolved: (recipientEmail) => ({
    subject: '✅ Resolved: Test Site incident resolved (Test Email)',
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
            .test-badge { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Incident Resolved</h1>
              <span class="test-badge">TEST EMAIL</span>
            </div>
            <div class="content">
              <h2>Test Website</h2>
              <p>The incident has been resolved and the site is back online.</p>
              <p><strong>Duration:</strong> 15 minutes</p>
              <p><strong>Resolved:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Summary:</strong> Server connection restored. All health checks passing.</p>
              <p><em>This is a test email to verify resolution notifications are working correctly.</em></p>
              <a href="https://example.com/incidents" class="button">View Incident History</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  simple: (recipientEmail) => ({
  subject: '📧 Simple Test Email from MonitHQ',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px; }
            h1 { color: #667eea; }
            .info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Email Test Successful!</h1>
            <p>This is a simple test email from your MonitHQ application.</p>
            <div class="info">
              <p><strong>Recipient:</strong> ${recipientEmail}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Service:</strong> Resend</p>
            </div>
            <p>If you're seeing this email, your email configuration is working correctly! 🎉</p>
          </div>
        </body>
      </html>
    `,
  }),
};

// Main test function
async function testEmail() {
  console.log('\n' + colors.bright + '='.repeat(60) + colors.reset);
  console.log(colors.bright + '  MonitHQ Email Testing Script' + colors.reset);
  console.log(colors.bright + '='.repeat(60) + colors.reset + '\n');

  // Get command line arguments
  const args = process.argv.slice(2);
  const recipientEmail = args[0];
  const templateType = args[1] || 'simple';

  // Validate arguments
  if (!recipientEmail) {
    log.error('Recipient email is required!');
    console.log('\nUsage: node scripts/test-email.js <recipient-email> [template]\n');
    console.log('Templates: simple, teamInvite, incidentCreated, incidentResolved\n');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    log.error('Invalid email format!');
    process.exit(1);
  }

  // Check environment variables
  log.step('Checking configuration...');
  
  if (!process.env.RESEND_API_KEY) {
    log.error('RESEND_API_KEY not found in environment variables!');
    log.warning('Please add RESEND_API_KEY to your .env file');
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  log.success('RESEND_API_KEY found');
  log.info(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

  // Validate template
  if (!testTemplates[templateType]) {
    log.error(`Template '${templateType}' not found!`);
    log.info('Available templates: ' + Object.keys(testTemplates).join(', '));
    process.exit(1);
  }

  // Initialize Resend
  log.step('Initializing Resend client...');
  const resend = new Resend(apiKey);
  log.success('Resend client initialized');

  // Prepare email content
  log.step(`Preparing '${templateType}' template...`);
  const emailContent = testTemplates[templateType](recipientEmail);
  log.success('Email content prepared');

  // Display email details
  console.log('\n' + colors.cyan + '─'.repeat(60) + colors.reset);
  console.log(colors.bright + 'Email Details:' + colors.reset);
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  console.log(`From:     MonitHQ <onboarding@resend.dev>`);
  console.log(`To:       ${recipientEmail}`);
  console.log(`Subject:  ${emailContent.subject}`);
  console.log(`Template: ${templateType}`);
  console.log(colors.cyan + '─'.repeat(60) + colors.reset + '\n');

  // Send email
  log.step('Sending test email...');
  
  try {
    const startTime = Date.now();
    
    const result = await resend.emails.send({
      from: 'MonitHQ <support@makvishan.com>',
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    const duration = Date.now() - startTime;

    console.log('\n' + colors.green + '='.repeat(60) + colors.reset);
    log.success('Email sent successfully! 🎉');
    console.log(colors.green + '='.repeat(60) + colors.reset + '\n');

    console.log(colors.bright + 'Response Details:' + colors.reset);
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nTime taken: ${duration}ms\n`);

    log.info('Check your inbox (and spam folder) for the test email.');
    log.warning('Note: Emails from onboarding@resend.dev may take a few minutes to arrive.');
    
    if (templateType !== 'simple') {
      log.info(`You can also run: node scripts/test-email.js ${recipientEmail} simple`);
    }

  } catch (error) {
    console.log('\n' + colors.red + '='.repeat(60) + colors.reset);
    log.error('Failed to send email! ❌');
    console.log(colors.red + '='.repeat(60) + colors.reset + '\n');

    console.log(colors.bright + 'Error Details:' + colors.reset);
    console.log(colors.red + error.message + colors.reset);
    
    if (error.response) {
      console.log('\nAPI Response:');
      console.log(JSON.stringify(error.response, null, 2));
    }

    console.log('\n' + colors.yellow + 'Troubleshooting Tips:' + colors.reset);
    console.log('1. Verify your RESEND_API_KEY is correct');
    console.log('2. Check if the API key has the correct permissions');
    console.log('3. Ensure your Resend account is active');
    console.log('4. Visit https://resend.com/docs for more information\n');

    process.exit(1);
  }
}

// Run the test
testEmail().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
