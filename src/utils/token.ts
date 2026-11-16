import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type AccessTokenPayload = { sub: string; role: 'CUSTOMER' | 'ADMIN' }

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] })
  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    (decoded.role !== 'CUSTOMER' && decoded.role !== 'ADMIN')
  ) {
    throw new Error('Invalid token payload')
  }
  return { sub: decoded.sub, role: decoded.role }
}

// Refresh tokens are random strings, not JWTs, so they can be revoked
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex')
}

// Only this hash is stored in the database, never the token itself
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}