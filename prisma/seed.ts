import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default ADMIN user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', adminUser.username)

  // Create default SystemConfig
  const systemConfig = await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      pollingInterval: 30,
      mikrotikIp: '',
      mikrotikUser: '',
      mikrotikPass: '',
      mikrotikPort: 8728,
    },
  })

  console.log('Created system config with polling interval:', systemConfig.pollingInterval)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
