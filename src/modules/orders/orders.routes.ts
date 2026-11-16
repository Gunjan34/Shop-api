import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validateBody, validateQuery } from '../../middleware/validate.js'
import { ordersController } from './orders.controller.js'
import { placeOrderSchema, updateStatusSchema, listOrdersQuerySchema } from './orders.schemas.js'

export const ordersRouter = Router()

// Every order route needs a logged-in user
ordersRouter.use(authenticate)

ordersRouter.post('/', validateBody(placeOrderSchema), ordersController.place)
ordersRouter.get('/', validateQuery(listOrdersQuerySchema), ordersController.list)
ordersRouter.get('/:id', ordersController.get)
ordersRouter.post('/:id/cancel', ordersController.cancel)
ordersRouter.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validateBody(updateStatusSchema),
  ordersController.updateStatus,
)