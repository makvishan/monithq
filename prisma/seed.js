const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.siteCheck.deleteMany();
  await prisma.site.deleteMany();
  await prisma.session.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create Organizations
  console.log('📦 Creating organizations...');
  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      logo: 'https://ui-avatars.com/api/?name=Acme&background=6366f1&color=fff',
    },
  });

  const techOrg = await prisma.organization.create({
    data: {
      name: 'TechStart Inc',
      logo: 'https://ui-avatars.com/api/?name=TechStart&background=8b5cf6&color=fff',
    },
  });

  console.log(`✅ Created ${acmeOrg.name} and ${techOrg.name}\n`);

  // Create Subscriptions
  console.log('💳 Creating subscriptions...');
  const acmeSub = await prisma.subscription.create({
    data: {
      organizationId: acmeOrg.id,
      plan: 'PRO',
      status: 'ACTIVE',
      amount: 9900, // $99/month in cents
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripeCustomerId: 'cus_test_acme',
      stripeSubscriptionId: 'sub_test_acme',
    },
  });

  const techSub = await prisma.subscription.create({
    data: {
      organizationId: techOrg.id,
      plan: 'STARTER',
      status: 'ACTIVE',
      amount: 2900, // $29/month in cents
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeCustomerId: 'cus_test_tech',
      stripeSubscriptionId: 'sub_test_tech',
    },
  });

  console.log(`✅ Created subscriptions\n`);

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  console.log('👥 Creating users...');
  
  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@monithq.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      organizationId: acmeOrg.id,
    },
  });

  // Acme Org Admin
  const acmeAdmin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'John Acme',
      role: 'ORG_ADMIN',
      organizationId: acmeOrg.id,
    },
  });

  // Acme Regular User
  const acmeUser = await prisma.user.create({
    data: {
      email: 'user@acme.com',
      password: hashedPassword,
      name: 'Jane Acme',
      role: 'USER',
      organizationId: acmeOrg.id,
    },
  });

  // TechStart Org Admin
  const techAdmin = await prisma.user.create({
    data: {
      email: 'admin@techstart.com',
      password: hashedPassword,
      name: 'Sarah Tech',
      role: 'ORG_ADMIN',
      organizationId: techOrg.id,
    },
  });

  console.log(`✅ Created 4 users (password for all: password123)\n`);

  // Create Sites for Acme
  console.log('🌐 Creating sites...');
  const acmeSite1 = await prisma.site.create({
    data: {
      name: 'Acme Main Website',
      url: 'https://acme.com',
      organizationId: acmeOrg.id,
      createdById: acmeAdmin.id,
      status: 'ONLINE',
      checkInterval: 60,
      region: 'US_EAST',
    },
  });

  const acmeSite2 = await prisma.site.create({
    data: {
      name: 'Acme API',
      url: 'https://api.acme.com',
      organizationId: acmeOrg.id,
      createdById: acmeAdmin.id,
      status: 'ONLINE',
      checkInterval: 30,
      region: 'US_WEST',
    },
  });

  const acmeSite3 = await prisma.site.create({
    data: {
      name: 'Acme Blog',
      url: 'https://blog.acme.com',
      organizationId: acmeOrg.id,
      createdById: acmeUser.id,
      status: 'DEGRADED',
      checkInterval: 300,
      region: 'EU_WEST',
    },
  });

  // Create Sites for TechStart
  const techSite1 = await prisma.site.create({
    data: {
      name: 'TechStart App',
      url: 'https://app.techstart.io',
      organizationId: techOrg.id,
      createdById: techAdmin.id,
      status: 'ONLINE',
      checkInterval: 60,
      region: 'US_EAST',
    },
  });

  const techSite2 = await prisma.site.create({
    data: {
      name: 'TechStart Landing Page',
      url: 'https://techstart.io',
      organizationId: techOrg.id,
      createdById: techAdmin.id,
      status: 'OFFLINE',
      checkInterval: 120,
      region: 'US_WEST',
    },
  });

  console.log(`✅ Created 5 sites\n`);

  // Create Site Checks
  console.log('📊 Creating site checks...');
  const now = Date.now();
  const checksToCreate = [];

  // Create 10 checks for each site over the last 24 hours
  for (const site of [acmeSite1, acmeSite2, acmeSite3, techSite1, techSite2]) {
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now - i * 60 * 60 * 1000); // Every hour
      const isOnline = site.status === 'ONLINE' ? Math.random() > 0.1 : Math.random() > 0.7;
      
      checksToCreate.push({
        siteId: site.id,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        responseTime: isOnline ? Math.floor(Math.random() * 500) + 50 : 0,
        statusCode: isOnline ? 200 : 500,
        checkedAt: timestamp,
      });
    }
  }

  await prisma.siteCheck.createMany({
    data: checksToCreate,
  });

  console.log(`✅ Created ${checksToCreate.length} site checks\n`);

  // Create Incidents
  console.log('🚨 Creating incidents...');
  
  // Resolved incident
  const incident1 = await prisma.incident.create({
    data: {
      siteId: acmeSite1.id,
      status: 'RESOLVED',
      severity: 'HIGH',
      aiSummary: 'API Gateway Timeout - Root cause: Database connection pool exhausted. Fixed by increasing pool size and optimizing slow queries.',
      startTime: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
      endTime: new Date(now - 3 * 60 * 60 * 1000), // 3 hours ago
      duration: 7200000, // 2 hours in milliseconds
      resolvedById: acmeAdmin.id,
    },
  });

  // Active incident
  const incident2 = await prisma.incident.create({
    data: {
      siteId: acmeSite3.id,
      status: 'INVESTIGATING',
      severity: 'MEDIUM',
      aiSummary: 'Slow Page Load Times - Blog pages loading slower than normal. Investigating CDN performance issues.',
      startTime: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  // Critical incident for offline site
  const incident3 = await prisma.incident.create({
    data: {
      siteId: techSite2.id,
      status: 'IDENTIFIED',
      severity: 'CRITICAL',
      aiSummary: 'Website Down - Landing page completely unresponsive. Server appears to be down. Investigating with hosting provider.',
      startTime: new Date(now - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  });

  console.log(`✅ Created 3 incidents\n`);

  // Create Notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: acmeAdmin.id,
        type: 'INCIDENT_RESOLVED',
        title: 'Incident Resolved',
        message: 'API Gateway Timeout has been resolved',
      },
      {
        userId: acmeAdmin.id,
        type: 'INCIDENT_CREATED',
        title: 'New Incident',
        message: 'Slow Page Load Times detected on Acme Blog',
        read: false,
      },
      {
        userId: techAdmin.id,
        type: 'INCIDENT_CREATED',
        title: 'Critical: Website Down',
        message: 'TechStart Landing Page is offline',
        read: false,
      },
    ],
  });

  console.log(`✅ Created 3 notifications\n`);

  // Create Audit Logs
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: acmeAdmin.id,
        action: 'SITE_CREATED',
        entity: 'Site',
        entityId: acmeSite1.id,
        details: { siteName: acmeSite1.name },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
      {
        userId: acmeAdmin.id,
        action: 'INCIDENT_RESOLVED',
        entity: 'Incident',
        entityId: incident1.id,
        details: { severity: incident1.severity },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
    ],
  });

  console.log(`✅ Created audit logs\n`);

  console.log('✨ Seed completed successfully!\n');
  console.log('📋 Demo Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Super Admin:');
  console.log('   Email: admin@monithq.com');
  console.log('   Password: password123');
  console.log('   Role: SUPER_ADMIN\n');
  
  console.log('🏢 Acme Corporation:');
  console.log('   Org Admin: admin@acme.com / password123');
  console.log('   User: user@acme.com / password123');
  console.log('   Plan: PRO ($99/month)');
  console.log('   Sites: 3\n');
  
  console.log('🏢 TechStart Inc:');
  console.log('   Org Admin: admin@techstart.com / password123');
  console.log('   Plan: STARTER ($29/month)');
  console.log('   Sites: 2\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
