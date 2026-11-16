import type { Request, Response } from 'express'
import { ordersService } from './orders.service.js'
import type { ListOrdersQuery } from './orders.schemas.js'

const idOf = (req: Request) => String(req.params.id)

export const ordersController = {
  async place(req: Request, res: Response) {
    const order = await ordersService.place(req.user!.id, req.body.items)
    res.status(201).json({ order })
  },

  async list(req: Request, res: Response) {
    res.json(await ordersService.list(req.user!.id, res.locals.query as ListOrdersQuery))
  },

  async get(req: Request, res: Response) {
    res.json({ order: await ordersService.get(idOf(req), req.user!) })
  },

  async cancel(req: Request, res: Response) {
    res.json({ order: await ordersService.cancel(idOf(req), req.user!) })
  },

  async updateStatus(req: Request, res: Response) {
    res.json({ order: await ordersService.updateStatus(idOf(req), req.body.status) })
  },
}