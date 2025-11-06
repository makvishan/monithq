const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeSuperAdmin() {
  try {
    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node scripts/make-super-admin.js <email>');
      process.exit(1);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Update user role to SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' },
    });

    console.log('✅ User updated successfully!');
    console.log('');
    console.log('User Details:');
    console.log('  Name:', updatedUser.name);
    console.log('  Email:', updatedUser.email);
    console.log('  Role:', updatedUser.role);
    console.log('');
    console.log('🎉 You can now access Super Admin settings!');
    console.log('   1. Logout and login again');
    console.log('   2. Go to Settings page');
    console.log('   3. Look for "Super Admin Controls" section (purple card with shield icon)');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeSuperAdmin();
