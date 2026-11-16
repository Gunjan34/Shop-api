import type { Request, Response } from 'express'
import { authService } from './auth.service.js'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/AppError.js'
import { REFRESH_TOKEN_TTL_MS } from '../../utils/token.js'

const baseCookie = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
}
const accessCookie = { ...baseCookie, maxAge: 15 * 60 * 1000 }
// The refresh cookie is only sent to /auth routes, never to the rest of the API
const refreshCookie = { ...baseCookie, path: '/auth', maxAge: REFRESH_TOKEN_TTL_MS }

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, accessCookie)
  res.cookie('refresh_token', refreshToken, refreshCookie)
}

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body)
    res.status(201).json({ user })
  },

  async login(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.login(req.body)
    setAuthCookies(res, accessToken, refreshToken)
    res.json({ user })
  },

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.refresh_token
    if (typeof raw !== 'string') throw new AppError(401, 'Not authenticated')
    const { accessToken, refreshToken } = await authService.refresh(raw)
    setAuthCookies(res, accessToken, refreshToken)
    res.json({ message: 'Token refreshed' })
  },

  async logout(req: Request, res: Response) {
    const raw = req.cookies?.refresh_token
    await authService.logout(typeof raw === 'string' ? raw : undefined)
    res.clearCookie('access_token', baseCookie)
    res.clearCookie('refresh_token', { ...baseCookie, path: '/auth' })
    res.status(204).send()
  },

  async me(req: Request, res: Response) {
    const user = await authService.getProfile(req.user!.id)
    res.json({ user })
  },
}