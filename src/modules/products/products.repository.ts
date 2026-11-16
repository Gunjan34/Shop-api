import { prisma } from '../../db.js'
import type { CreateProductInput, UpdateProductInput } from './products.schemas.js'

type ProductCreateData = Parameters<typeof prisma.product.create>[0]['data']
type ProductUpdateData = Parameters<typeof prisma.product.update>[0]['data']

// exactOptionalPropertyTypes: Prisma rejects explicit `undefined` values
const stripUndefined = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T

export const productsRepository = {
  findManyActive: (skip: number, take: number) =>
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),

  countActive: () => prisma.product.count({ where: { isActive: true } }),

  findById: (id: string) => prisma.product.findUnique({ where: { id } }),

  create: (data: CreateProductInput) =>
    prisma.product.create({ data: stripUndefined(data) as ProductCreateData }),

  update: (id: string, data: UpdateProductInput) =>
    prisma.product.update({ where: { id }, data: stripUndefined(data) as ProductUpdateData }),
}
