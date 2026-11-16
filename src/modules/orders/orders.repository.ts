import { prisma } from '../../db.js'
import { AppError } from '../../utils/AppError.js'

type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED'

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true } } } },
} as const

export const ordersRepository = {
  // The stock check and the order creation must succeed or fail together,
  // so the transaction lives here, next to the Prisma client.
  async placeOrder(userId: string, items: { productId: string; quantity: number }[]) {
    // A consistent lock order stops two concurrent orders from deadlocking each other
    const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId))

    return prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: sorted.map((i) => i.productId) } },
      })
      const byId = new Map(products.map((p) => [p.id, p]))

      for (const item of sorted) {
        const product = byId.get(item.productId)
        if (!product || !product.isActive) {
          throw new AppError(404, `Product ${item.productId} is not available`)
        }
        // One statement does the check and the decrement, so the database decides
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (count === 0) {
          throw new AppError(409, `Insufficient stock for ${product.name}`)
        }
      }

      return tx.order.create({
        data: {
          userId,
          items: {
            create: sorted.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: byId.get(item.productId)!.price, // price snapshot at purchase time
            })),
          },
        },
        include: orderInclude,
      })
    })
  },

  // Returns null if no PENDING order matched (missing, not yours, or not pending)
  async cancelOrder(id: string, onlyForUserId: string | null) {
    return prisma.$transaction(async (tx) => {
      // Only one request can win PENDING -> CANCELLED, so stock is restored exactly once
      const { count } = await tx.order.updateMany({
        where: { id, status: 'PENDING', ...(onlyForUserId ? { userId: onlyForUserId } : {}) },
        data: { status: 'CANCELLED' },
      })
      if (count === 0) return null

      const items = await tx.orderItem.findMany({ where: { orderId: id } })
      items.sort((a, b) => a.productId.localeCompare(b.productId))
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude })
    })
  },

  findById: (id: string) => prisma.order.findUnique({ where: { id }, include: orderInclude }),

  findByUser: (userId: string, skip: number, take: number) =>
    prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
    }),

  countByUser: (userId: string) => prisma.order.count({ where: { userId } }),

  // Succeeds only if the order is still in the expected status (count 0 otherwise)
  transition: (id: string, from: OrderStatus, to: OrderStatus) =>
    prisma.order.updateMany({ where: { id, status: from }, data: { status: to } }),
}