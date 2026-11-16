import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validateBody, validateQuery } from '../../middleware/validate.js'
import { productsController } from './products.controller.js'
import { createProductSchema, updateProductSchema, listQuerySchema } from './products.schemas.js'

export const productsRouter = Router()

productsRouter.get('/', validateQuery(listQuerySchema), productsController.list)
productsRouter.get('/:id', productsController.get)

productsRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validateBody(createProductSchema),
  productsController.create,
)
productsRouter.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validateBody(updateProductSchema),
  productsController.update,
)
productsRouter.delete('/:id', authenticate, requireRole('ADMIN'), productsController.remove)
