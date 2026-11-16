import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError.js'

type Role = 'CUSTOMER' | 'ADMIN'

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'Not authenticated')
    if (!roles.includes(req.user.role)) throw new AppError(403, 'Forbidden')
    next()
  }