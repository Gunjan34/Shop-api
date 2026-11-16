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

  createRefreshToken: (data: { tokenHash: string; userId: string; expiresAt: Date }) =>
    prisma.refreshToken.create({ data }),

  findRefreshToken: (tokenHash: string) =>
    prisma.refreshToken.findUnique({ where: { tokenHash } }),

  // Atomic: count is 1 if this call revoked the token, 0 if it was already revoked
  revokeIfActive: (id: string) =>
    prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),

  revokeAllUserTokens: (userId: string) =>
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
}