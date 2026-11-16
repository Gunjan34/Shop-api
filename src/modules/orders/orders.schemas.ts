import { z } from 'zod'

export const placeOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(100) }))
    .min(1, 'An order needs at least one item')
    .max(50)
    .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, {
      message: 'Each product may appear only once',
    }),
})

// Cancelling has its own endpoint because it must restore stock
export const updateStatusSchema = z.object({
  status: z.enum(['PAID', 'SHIPPED']),
})

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>