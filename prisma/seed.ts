import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@etheryte.com' },
    update: {
      isVerified: true,
      isActive: true,
      role: 'USER',
    },
    create: {
      email: 'demo@etheryte.com',
      username: 'demo_user',
      passwordHash: hashedPassword,
      isAdmin: false,
      isVerified: true,
      isActive: true,
      role: 'USER',
    },
  })

  console.log('Demo user created:', demoUser)

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@etheryte.com' },
    update: {
      isAdmin: true,
      isVerified: true,
      isActive: true,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@etheryte.com',
      username: 'admin',
      passwordHash: adminPassword,
      isAdmin: true,
      isVerified: true,
      isActive: true,
      role: 'ADMIN',
    },
  })

  console.log('Admin user created:', adminUser)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })