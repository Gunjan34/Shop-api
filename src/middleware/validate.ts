import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/AppError.js'

export const validateBody =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.map(String).join('.'),
        message: i.message,
      }))
      throw new AppError(400, 'Validation failed', details)
    }
    req.body = result.data
    next()
  }