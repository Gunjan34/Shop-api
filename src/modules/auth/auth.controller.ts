import type { Request, Response } from 'express'
import { authService } from './auth.service.js'
import { env } from '../../config/env.js'

const accessCookie = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000,
}

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body)
    res.status(201).json({ user })
  },

  async login(req: Request, res: Response) {
    const { user, accessToken } = await authService.login(req.body)
    res.cookie('access_token', accessToken, accessCookie)
    res.json({ user })
  },

  async me(req: Request, res: Response) {
    const user = await authService.getProfile(req.user!.id)
    res.json({ user })
  },
}