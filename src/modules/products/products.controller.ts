import type { Request, Response } from 'express'
import { productsService } from './products.service.js'
import type { ListQuery } from './products.schemas.js'

const idOf = (req: Request) => String(req.params.id)

export const productsController = {
  async list(_req: Request, res: Response) {
    res.json(await productsService.list(res.locals.query as ListQuery))
  },

  async get(req: Request, res: Response) {
    res.json({ product: await productsService.getById(idOf(req)) })
  },

  async create(req: Request, res: Response) {
    const product = await productsService.create(req.body)
    res.status(201).json({ product })
  },

  async update(req: Request, res: Response) {
    res.json({ product: await productsService.update(idOf(req), req.body) })
  },

  async remove(req: Request, res: Response) {
    await productsService.remove(idOf(req))
    res.status(204).send()
  },
}