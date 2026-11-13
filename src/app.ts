import express from 'express'
import type { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { authRouter } from './modules/auth/auth.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export const app = express()

app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/auth', authRouter)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)