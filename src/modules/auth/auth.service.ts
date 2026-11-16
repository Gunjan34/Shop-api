import * as argon2 from 'argon2'
import { authRepository } from './auth.repository.js'
import { AppError } from '../../utils/AppError.js'
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from '../../utils/token.js'
import type { RegisterInput, LoginInput } from './auth.schemas.js'

// Used to keep login timing the same when the email doesn't exist
const DUMMY_HASH = await argon2.hash('dummy-password-for-timing')

// Treats a malformed stored hash as "wrong password" instead of crashing
async function safeVerify(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = generateRefreshToken()
  await authRepository.createRefreshToken({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  })
  return token
}

export const authService = {
  async register({ email, password }: RegisterInput) {
    if (await authRepository.findUserByEmail(email)) {
      throw new AppError(409, 'Email already registered')
    }
    const hash = await argon2.hash(password)
    try {
      return await authRepository.createUser({ email, password: hash })
    } catch (err) {
      // Two requests can race past the check above; the database constraint is the real guard
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
        throw new AppError(409, 'Email already registered')
      }
      throw err
    }
  },

  async login({ email, password }: LoginInput) {
    const user = await authRepository.findUserByEmail(email)
    const valid = await safeVerify(user?.password ?? DUMMY_HASH, password)
    if (!user || !valid) {
      throw new AppError(401, 'Invalid email or password')
    }
    const accessToken = signAccessToken({ sub: user.id, role: user.role })
    const refreshToken = await issueRefreshToken(user.id)
    return {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    }
  },

  async refresh(rawToken: string) {
    const stored = await authRepository.findRefreshToken(hashToken(rawToken))
    if (!stored) throw new AppError(401, 'Invalid refresh token')

    if (stored.revokedAt) {
      // A revoked token was used again: assume it leaked and end every session for this user
      await authRepository.revokeAllUserTokens(stored.userId)
      throw new AppError(401, 'Invalid refresh token')
    }
    if (stored.expiresAt < new Date()) {
      throw new AppError(401, 'Refresh token expired')
    }

    // Only one concurrent request can win this rotation
    const { count } = await authRepository.revokeIfActive(stored.id)
    if (count === 0) {
      await authRepository.revokeAllUserTokens(stored.userId)
      throw new AppError(401, 'Invalid refresh token')
    }

    const user = await authRepository.findUserById(stored.userId)
    if (!user) throw new AppError(401, 'Invalid refresh token')

    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role }),
      refreshToken: await issueRefreshToken(user.id),
    }
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return
    const stored = await authRepository.findRefreshToken(hashToken(rawToken))
    if (stored) await authRepository.revokeIfActive(stored.id)
  },

  async getProfile(userId: string) {
    const user = await authRepository.findUserById(userId)
    if (!user) throw new AppError(401, 'Not authenticated')
    return user
  },
}