import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type AccessTokenPayload = { sub: string; role: 'CUSTOMER' | 'ADMIN' }

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