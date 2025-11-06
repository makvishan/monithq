const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setFreePlan() {
  try {
    // Find user with email
    const user = await prisma.user.findUnique({
      where: { email: 'admin@acme.com' },
      include: { 
        organization: { 
          include: { subscription: true } 
        } 
      }
    });
    
    if (!user) {
      console.log('❌ User admin@acme.com not found');
      return;
    }
    
    console.log('✓ Found user:', user.email);
    console.log('✓ Organization ID:', user.organizationId);
    
    if (!user.organizationId) {
      console.log('❌ User has no organization');
      return;
    }
    
    if (user.organization?.subscription) {
      // Update existing subscription to FREE
      const updated = await prisma.subscription.update({
        where: { id: user.organization.subscription.id },
        data: {
          plan: 'FREE',
          status: 'ACTIVE',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          amount: 0,
          currentPeriodEnd: new Date(),
          cancelAtPeriodEnd: false
        }
      });
      console.log('✅ Subscription updated to FREE plan');
      console.log('  Plan:', updated.plan);
      console.log('  Status:', updated.status);
    } else {
      // Create FREE subscription
      const created = await prisma.subscription.create({
        data: {
          organizationId: user.organizationId,
          plan: 'FREE',
          status: 'ACTIVE'
        }
      });
      console.log('✅ FREE subscription created');
      console.log('  ID:', created.id);
      console.log('  Plan:', created.plan);
    }
    
    console.log('\n🎉 User admin@acme.com is now on FREE plan!');
    console.log('   You can now test upgrading to a paid plan.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setFreePlan();
