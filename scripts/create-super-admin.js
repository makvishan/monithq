const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeSuperAdmin() {
  try {
    // Get email from command line argument
    const email = 'makvishan@gmail.com'
    
    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node scripts/create-super-admin.js <email>');
      process.exit(1);
    }

    // Find user by email
    let user = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN'},
    });

    if (!user) {
      // Create new super admin user
      user = await prisma.user.create({
        data: {
          email,
          name: 'Super Admin',
          password: 'Mkveera@123', // You may want to hash this or set from env
          role: 'SUPER_ADMIN',
          emailVerified: true,
        },
      });
      console.log('✅ Super Admin user created!');
    } else if (user.role !== 'SUPER_ADMIN') {
      // Update user role to SUPER_ADMIN
      user = await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' },
      });
      console.log('✅ User updated to SUPER_ADMIN!');
    } else {
      console.log('ℹ️ User is already SUPER_ADMIN. No changes made.');
    }

    console.log('');
    console.log('User Details:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
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
