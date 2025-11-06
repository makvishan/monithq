const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareStripePlans() {
  console.log('📊 Comparing Database vs Stripe Plans\n');
  console.log('=' .repeat(80));

  // Stripe data from CLI output
  const stripePrices = {
    'price_1SQN82QuBR2IB5zIwvJntBTh': { product: 'Starter', amount: 1000 }, // $10
    'price_1SQN8SQuBR2IB5zI1SAYTxWy': { product: 'Pro', amount: 2000 },     // $20
    'price_1SQN8jQuBR2IB5zI6oYyRErW': { product: 'Enterprise', amount: 3000 }, // $30
    'price_1SQPV7QuBR2IB5zIY72gPt1R': { product: 'myproduct', amount: 1500 }, // $15 (unknown)
  };

  try {
    // Get all plans from database
    const dbPlans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        name: true,
        displayName: true,
        price: true,
        stripePriceId: true,
        isActive: true,
      },
    });

    console.log('\n🗄️  DATABASE PLANS:\n');
    dbPlans.forEach((plan) => {
      console.log(`${plan.name.padEnd(15)} | $${(plan.price / 100).toFixed(2).padStart(6)} | ${plan.stripePriceId || 'null (FREE plan)'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💳 STRIPE PRICES:\n');
    Object.entries(stripePrices).forEach(([priceId, data]) => {
      console.log(`${data.product.padEnd(15)} | $${(data.amount / 100).toFixed(2).padStart(6)} | ${priceId}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  DISCREPANCIES:\n');

    let hasDiscrepancies = false;

    // Check each paid plan
    const paidPlans = dbPlans.filter((p) => p.stripePriceId);
    
    paidPlans.forEach((dbPlan) => {
      const stripeData = stripePrices[dbPlan.stripePriceId];
      
      if (!stripeData) {
        console.log(`❌ ${dbPlan.name}: Price ID "${dbPlan.stripePriceId}" NOT FOUND in Stripe`);
        hasDiscrepancies = true;
      } else if (dbPlan.price !== stripeData.amount) {
        console.log(`❌ ${dbPlan.name}: Price mismatch!`);
        console.log(`   Database: $${(dbPlan.price / 100).toFixed(2)} (${dbPlan.price} cents)`);
        console.log(`   Stripe:   $${(stripeData.amount / 100).toFixed(2)} (${stripeData.amount} cents)`);
        console.log(`   Difference: $${((stripeData.amount - dbPlan.price) / 100).toFixed(2)}`);
        hasDiscrepancies = true;
      } else {
        console.log(`✅ ${dbPlan.name}: Matches Stripe ($${(dbPlan.price / 100).toFixed(2)})`);
      }
    });

    if (!hasDiscrepancies) {
      console.log('✅ All plans match between database and Stripe!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 RECOMMENDATIONS:\n');

    paidPlans.forEach((dbPlan) => {
      const stripeData = stripePrices[dbPlan.stripePriceId];
      if (stripeData && dbPlan.price !== stripeData.amount) {
        console.log(`\n🔧 Update ${dbPlan.name} plan:`);
        console.log(`   Option 1: Update database to match Stripe ($${(stripeData.amount / 100).toFixed(2)})`);
        console.log(`   Option 2: Update Stripe to match database ($${(dbPlan.price / 100).toFixed(2)})`);
        console.log(`   Option 3: Use a different Stripe Price ID`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

compareStripePlans();
