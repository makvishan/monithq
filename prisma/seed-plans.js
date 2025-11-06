const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding plans...');

  const plans = [
    {
      name: 'FREE',
      displayName: 'Free',
      description: 'Perfect for trying out the service',
      price: 0,
      stripePriceId: null,
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      maxSites: 1,
      maxTeamMembers: 1,
      minCheckInterval: 300, // 5 minutes
      maxAICredits: 100,
      allowedChannels: ['email'],
      features: JSON.stringify([
        '1 site monitoring',
        '5-minute check intervals',
        'Basic incident tracking',
        'Email notifications',
      ]),
    },
    {
      name: 'STARTER',
      displayName: 'Starter',
      description: 'Great for small teams and growing projects',
      price: 2900, // $29
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || null,
      isActive: true,
      isPopular: false,
      sortOrder: 2,
      maxSites: 10,
      maxTeamMembers: 5,
      minCheckInterval: 60, // 1 minute
      maxAICredits: 1000,
      allowedChannels: ['email', 'slack'],
      features: JSON.stringify([
        '10 sites monitoring',
        '1-minute check intervals',
        'Advanced incident tracking',
        'Email & Slack notifications',
        'Up to 5 team members',
      ]),
    },
    {
      name: 'PRO',
      displayName: 'Pro',
      description: 'For professionals who need more power',
      price: 7900, // $79
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || null,
      isActive: true,
      isPopular: true,
      sortOrder: 3,
      maxSites: -1, // unlimited
      maxTeamMembers: 10,
      minCheckInterval: 30, // 30 seconds
      maxAICredits: 5000,
      allowedChannels: ['email', 'slack', 'sms', 'webhook'],
      features: JSON.stringify([
        'Unlimited sites monitoring',
        '30-second check intervals',
        'Priority support',
        'All notification channels (Email, Slack, SMS, Webhook)',
        'Up to 10 team members',
        'Custom status pages',
      ]),
    },
    {
      name: 'ENTERPRISE',
      displayName: 'Enterprise',
      description: 'Custom solution for large organizations',
      price: 29900, // $299
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || null,
      isActive: true,
      isPopular: false,
      sortOrder: 4,
      maxSites: -1, // unlimited
      maxTeamMembers: -1, // unlimited
      minCheckInterval: 10, // 10 seconds
      maxAICredits: -1, // unlimited
      allowedChannels: ['email', 'slack', 'sms', 'webhook'],
      features: JSON.stringify([
        'Unlimited sites monitoring',
        '10-second check intervals',
        'Dedicated support',
        'All notification channels (Email, Slack, SMS, Webhook)',
        'Unlimited team members',
        'Custom status pages',
        'API access',
        'White-label options',
      ]),
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ Seeded plan: ${plan.displayName}`);
  }

  console.log('✅ Plans seeded successfully!');
}

seedPlans()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
