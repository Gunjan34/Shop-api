import { ordersRepository } from './orders.repository.js'
import { AppError } from '../../utils/AppError.js'
import type { ListOrdersQuery } from './orders.schemas.js'

type Actor = { id: string; role: 'CUSTOMER' | 'ADMIN' }

const withTotal = <T extends { items: { quantity: number; unitPrice: number }[] }>(order: T) => ({
  ...order,
  total: order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
})

const canSee = (order: { userId: string }, actor: Actor) =>
  actor.role === 'ADMIN' || order.userId === actor.id

export const ordersService = {
  async place(userId: string, items: { productId: string; quantity: number }[]) {
    return withTotal(await ordersRepository.placeOrder(userId, items))
  },

  async list(userId: string, { page, limit }: ListOrdersQuery) {
    const [orders, total] = await Promise.all([
      ordersRepository.findByUser(userId, (page - 1) * limit, limit),
      ordersRepository.countByUser(userId),
    ])
    return {
      orders: orders.map(withTotal),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  async get(id: string, actor: Actor) {
    const order = await ordersRepository.findById(id)
    // 404 (not 403) for other people's orders, so ids can't be probed
    if (!order || !canSee(order, actor)) throw new AppError(404, 'Order not found')
    return withTotal(order)
  },

  async cancel(id: string, actor: Actor) {
    const cancelled = await ordersRepository.cancelOrder(
      id,
      actor.role === 'ADMIN' ? null : actor.id,
    )
    if (cancelled) return withTotal(cancelled)

    const order = await ordersRepository.findById(id)
    if (!order || !canSee(order, actor)) throw new AppError(404, 'Order not found')
    throw new AppError(409, `Only PENDING orders can be cancelled (this one is ${order.status})`)
  },

  async updateStatus(id: string, to: 'PAID' | 'SHIPPED') {
    const from = to === 'PAID' ? 'PENDING' : 'PAID'
    const { count } = await ordersRepository.transition(id, from, to)

    const order = await ordersRepository.findById(id)
    if (!order) throw new AppError(404, 'Order not found')
    if (count === 0) {
      throw new AppError(409, `Cannot move an order from ${order.status} to ${to}`)
    }
    return withTotal(order)
  },
}
