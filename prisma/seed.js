const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.aiInsight.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.siteSubscription.deleteMany();
  await prisma.statusPage.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.apiKey.deleteMany();
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
  // Ensure default SUPER_ADMIN user exists
  const superAdminName = process.env.SUPER_ADMIN_NAME ;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ;
  const superAdminExists = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  let superAdmin;
  if (!superAdminExists) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        name: superAdminName,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('✅ Default SUPER_ADMIN user created:', superAdminEmail);
  } else {
    superAdmin = superAdminExists;
    console.log('ℹ️ SUPER_ADMIN user already exists:', superAdminEmail);
  }
  // Create demo data for remaining models
    // Create 3 plans: Free, Starter, Pro
    await prisma.plan.createMany({
      data: [
        {
          name: 'free',
          displayName: 'Free',
          description: 'Default free plan',
          price: 0,
          isActive: true,
          isPopular: false,
          sortOrder: 1,
          maxSites: 1,
          maxTeamMembers: 1,
          minCheckInterval: 300,
          maxAICredits: 10,
          allowedChannels: ['email'],
          features: [],
        },
        {
          name: 'starter',
          displayName: 'Starter',
          description: 'Starter plan for small teams',
          price: 2900,
          isActive: true,
          isPopular: true,
          sortOrder: 2,
          maxSites: 5,
          maxTeamMembers: 5,
          minCheckInterval: 120,
          maxAICredits: 100,
          allowedChannels: ['email', 'slack'],
          features: ["Basic Monitoring", "Email & Slack Alerts"],
        },
        {
          name: 'pro',
          displayName: 'Pro',
          description: 'Pro plan for growing businesses',
          price: 9900,
          isActive: true,
          isPopular: false,
          sortOrder: 3,
          maxSites: 20,
          maxTeamMembers: 20,
          minCheckInterval: 60,
          maxAICredits: 1000,
          allowedChannels: ['email', 'slack', 'sms', 'webhook'],
          features: ["Advanced Monitoring", "All Notification Channels", "Priority Support"],
        },
      ],
      skipDuplicates: true,
    });

  console.log('\n🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
