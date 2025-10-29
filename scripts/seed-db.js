const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create demo user
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@etheryte.com' },
      update: {},
      create: {
        email: 'demo@etheryte.com',
        username: 'demo_user',
        password: hashedPassword,
        isAdmin: false,
      },
    });

    console.log('Demo user created:', demoUser);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@etheryte.com' },
      update: {},
      create: {
        email: 'admin@etheryte.com',
        username: 'admin',
        password: adminPassword,
        isAdmin: true,
      },
    });

    console.log('Admin user created:', adminUser);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();