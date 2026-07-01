import { Type, type Static } from "@sinclair/typebox"

export const ProductResponse = Type.Object({
  id: Type.String(),
  code: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  category: Type.Optional(
    Type.Object({
      id: Type.String(),
      name: Type.String(),
    }),
  ),
  unitPrice: Type.Number(),
  costPrice: Type.Number(),
  stock: Type.Integer(),
  minStock: Type.Integer(),
  active: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export const CreateProductBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  code: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  unitPrice: Type.Number({ exclusiveMinimum: 0 }),
  costPrice: Type.Number({ exclusiveMinimum: 0 }),
  stock: Type.Optional(Type.Integer({ minimum: 0 })),
  description: Type.Optional(Type.String()),
  minStock: Type.Optional(Type.Integer({ minimum: 0 })),
})

export const UpdateProductBody = Type.Object({
  name: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  unitPrice: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
  costPrice: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
  description: Type.Optional(Type.String()),
  minStock: Type.Optional(Type.Integer({ minimum: 0 })),
})

export const AdjustStockBody = Type.Object({
  quantity: Type.Integer(),
  reason: Type.Optional(Type.String()),
})

export const ProductQueryString = Type.Object({
  page: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number()),
  search: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  active: Type.Optional(Type.Boolean()),
})

export const CategoryResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  active: Type.Boolean(),
  createdAt: Type.String(),
})

export const CreateCategoryBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
})

export const UpdateCategoryBody = Type.Object({
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
})

export const PaginatedProductResponse = Type.Object({
  data: Type.Array(ProductResponse),
  total: Type.Integer(),
  page: Type.Integer(),
  limit: Type.Integer(),
  totalPages: Type.Integer(),
})

export type ProductResponseType = Static<typeof ProductResponse>
export type CreateProductBodyType = Static<typeof CreateProductBody>
export type UpdateProductBodyType = Static<typeof UpdateProductBody>
export type AdjustStockBodyType = Static<typeof AdjustStockBody>
export type ProductQueryStringType = Static<typeof ProductQueryString>
export type CategoryResponseType = Static<typeof CategoryResponse>
export type CreateCategoryBodyType = Static<typeof CreateCategoryBody>
export type UpdateCategoryBodyType = Static<typeof UpdateCategoryBody>
