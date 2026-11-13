import { prisma } from './db.js'

const user = await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: {},
  create: { email: 'test@example.com', password: 'not-a-real-hash' },
})

console.log('User:', user)
console.log('Total users:', await prisma.user.count())

await prisma.$disconnect()