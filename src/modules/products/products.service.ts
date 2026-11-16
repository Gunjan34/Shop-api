import { productsRepository } from './products.repository.js'
import { AppError } from '../../utils/AppError.js'
import type { CreateProductInput, UpdateProductInput, ListQuery } from './products.schemas.js'

export const productsService = {
  async list({ page, limit }: ListQuery) {
    const [products, total] = await Promise.all([
      productsRepository.findManyActive((page - 1) * limit, limit),
      productsRepository.countActive(),
    ])
    return { products, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async getById(id: string) {
    const product = await productsRepository.findById(id)
    if (!product || !product.isActive) throw new AppError(404, 'Product not found')
    return product
  },

  create: (input: CreateProductInput) => productsRepository.create(input),

  async update(id: string, input: UpdateProductInput) {
    if (!(await productsRepository.findById(id))) throw new AppError(404, 'Product not found')
    return productsRepository.update(id, input)
  },

  // Soft delete: the row stays so past orders keep pointing at it
  async remove(id: string) {
    if (!(await productsRepository.findById(id))) throw new AppError(404, 'Product not found')
    await productsRepository.update(id, { isActive: false })
  },
}