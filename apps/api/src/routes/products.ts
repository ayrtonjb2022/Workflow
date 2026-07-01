import { FastifyInstance } from "fastify"
import { Type } from "@sinclair/typebox"
import { productsService } from "../modules/products/products.service.js"
import { productsRepository } from "../modules/products/products.repository.js"
import { authGuard } from "../plugins/auth-guard.js"
import { ValidationError } from "../lib/errors.js"
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateProductBody,
  UpdateProductBody,
  AdjustStockBody,
} from "../modules/products/products.schema.js"

export async function productRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard)

  // ── Categories ─────────────────────────────────────────────

  // GET /api/categories — list all active
  app.get("/categories", {
    config: { requiredPermission: "categories:read" },
    schema: {},
  }, async (request) => {
    return productsRepository.findAllCategories(request.tenantId)
  })

  // POST /api/categories — create
  app.post("/categories", {
    config: { requiredPermission: "categories:create" },
    schema: {
      body: CreateCategoryBody,
    },
  }, async (request) => {
    const body = request.body as {
      name: string
      description?: string
    }

    // Check name uniqueness
    const existing = await productsRepository.findCategoryByName(body.name, request.tenantId)
    if (existing) {
      throw new ValidationError("A category with this name already exists in this tenant")
    }

    return productsRepository.createCategory({
      tenantId: request.tenantId,
      name: body.name,
      description: body.description,
    })
  })

  // PATCH /api/categories/:id — update
  app.patch("/categories/:id", {
    config: { requiredPermission: "categories:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: UpdateCategoryBody,
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      name?: string
      description?: string
    }

    // Check name uniqueness if changing name
    if (body.name) {
      const existing = await productsRepository.findCategoryByName(body.name, request.tenantId)
      if (existing && existing.id !== id) {
        throw new ValidationError("A category with this name already exists in this tenant")
      }
    }

    return productsRepository.updateCategory(id, request.tenantId, body)
  })

  // ── Products ───────────────────────────────────────────────

  // GET /api/products — list with pagination and search
  app.get("/products", {
    config: { requiredPermission: "products:read" },
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number()),
        limit: Type.Optional(Type.Number()),
        search: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.String()),
        active: Type.Optional(Type.String()),
      }),
    },
  }, async (request) => {
    const query = request.query as {
      page?: number
      limit?: number
      search?: string
      categoryId?: string
      active?: string
    }
    const active = query.active !== undefined
      ? query.active === "true"
      : undefined
    return productsService.list(
      request.tenantId,
      query.page,
      query.limit,
      query.search,
      query.categoryId,
      active,
    )
  })

  // GET /api/products/:id — get by id
  app.get("/products/:id", {
    config: { requiredPermission: "products:read" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return productsService.get(id, request.tenantId)
  })

  // POST /api/products — create
  app.post("/products", {
    config: { requiredPermission: "products:create" },
    schema: {
      body: CreateProductBody,
    },
  }, async (request, reply) => {
    const body = request.body as {
      name: string
      code?: string
      categoryId?: string
      unitPrice: number
      costPrice: number
      stock?: number
      description?: string
      minStock?: number
    }
    const product = await productsService.create({
      ...body,
      tenantId: request.tenantId,
    })
    return reply.status(201).send(product)
  })

  // PATCH /api/products/:id — update
  app.patch("/products/:id", {
    config: { requiredPermission: "products:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductBody,
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      name?: string
      categoryId?: string
      unitPrice?: number
      costPrice?: number
      description?: string
      minStock?: number
    }
    return productsService.update(id, request.tenantId, body)
  })

  // DELETE /api/products/:id — deactivate (soft delete)
  app.delete("/products/:id", {
    config: { requiredPermission: "products:delete" },
    schema: {
      params: Type.Object({ id: Type.String() }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    return productsService.deactivate(id, request.tenantId)
  })

  // POST /api/products/:id/adjust-stock — stock adjustment
  app.post("/products/:id/adjust-stock", {
    config: { requiredPermission: "products:update" },
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: AdjustStockBody,
    },
  }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { quantity: number; reason?: string }
    return productsService.adjustStock(id, request.tenantId, body.quantity, body.reason)
  })
}
