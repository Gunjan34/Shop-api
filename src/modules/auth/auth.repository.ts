import { prisma } from '../../db.js'

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findUserById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, createdAt: true }, // never return the hash
    }),

  createUser: (data: { email: string; password: string }) =>
    prisma.user.create({
      data,
      select: { id: true, email: true, role: true, createdAt: true }, // never return the hash
    }),
}