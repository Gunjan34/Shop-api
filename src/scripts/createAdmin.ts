import 'dotenv/config'
import * as argon2 from 'argon2'
import { prisma } from '../db.js'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD

if (!email || !password || password.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).')
  process.exit(1)
}

const existing = await prisma.user.findUnique({ where: { email } })

if (existing) {
  await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
  console.log(`Existing user ${email} promoted to ADMIN (password unchanged).`)
} else {
  await prisma.user.create({
    data: { email, password: await argon2.hash(password), role: 'ADMIN' },
  })
  console.log(`Admin ${email} created.`)
}

await prisma.$disconnect()