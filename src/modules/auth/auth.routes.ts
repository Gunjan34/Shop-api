import { Router } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authController } from './auth.controller.js'
import { registerSchema, loginSchema } from './auth.schemas.js'

export const authRouter = Router()

authRouter.post('/register', validateBody(registerSchema), authController.register)
authRouter.post('/login', validateBody(loginSchema), authController.login)
authRouter.get('/me', authenticate, authController.me)