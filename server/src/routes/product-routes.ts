import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function productRoutes(app: FastifyInstance) {
  const appTyped = app.withTypeProvider<ZodTypeProvider>()

  // 1. Criar Produto
  appTyped.post('/products', {
    schema: {
      body: z.object({
        name: z.string(),
        description: z.string().optional().nullable(),
        sku: z.string(),
        barcode: z.string().optional().nullable(),
        unitOfMeasure: z.string(),
        minStock: z.number().default(0),
        maxStock: z.number().optional().nullable(),
        purchasePrice: z.number().default(0),
        sellingPrice: z.number().default(0),
        averageCost: z.number().default(0), 
        categoryId: z.string().uuid(),
        aisle: z.string().optional().nullable(),
        shelf: z.string().optional().nullable(),
        batch: z.string().optional().nullable(),
      })
    }
  }, async (request, reply) => {
    const data = request.body

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku }
    })

    if (existingSku) {
      return reply.status(400).send({ message: 'SKU already exists' })
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        currentStock: 0,
        description: data.description || null,
        barcode: data.barcode || null,
        maxStock: data.maxStock || null,
        aisle: data.aisle || null,
        shelf: data.shelf || null,
        batch: data.batch || null,
      }
    })

    return reply.status(201).send(product)
  })

  // 2. Listar Produtos
  appTyped.get('/products', async () => {
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: [
        { name: 'asc' },
        { size: 'asc' }
      ]
    })
    return products
  })

  // 3. Buscar Produto por ID
  appTyped.get('/products/:id', {
    schema: {
      params: z.object({
        id: z.string().uuid()
      })
    }
  }, async (request, reply) => {
    const { id } = request.params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!product) {
      return reply.status(404).send({ message: 'Product not found' })
    }

    return product
  })

  // 4. Bulk Insert (IA Integration)
  appTyped.post('/products/bulk-insert', {
    schema: {
      body: z.object({
        products: z.array(z.object({
          sku: z.string(),
          nome: z.string(),
          cor: z.string().optional().nullable(),
          tam: z.string().optional().nullable(),
          qtd: z.number(),
          purchasePrice: z.number(),
        }))
      })
    }
  }, async (request, reply) => {
    const { products } = request.body
    console.log(`--- INICIANDO BULK INSERT: ${products.length} itens ---`)

    try {
      let defaultCategory = await prisma.category.findFirst({
        where: { name: 'Escritório' }
      })

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: { name: 'Escritório' }
        })
      }

      const results = []

      for (const item of products) {
        console.log(`Processando SKU: ${item.sku} | Nome: ${item.nome}`)
        
        // Pega o preço de compra vindo do item (ou tenta nomes alternativos se o front estiver com cache)
        const purchasePrice = item.purchasePrice || (item as any).sellingPrice || 0;

        const product = await prisma.product.upsert({
          where: { sku: item.sku },
          update: {
            currentStock: { increment: item.qtd },
            purchasePrice: purchasePrice,
            averageCost: purchasePrice, // Atualiza média com a última compra
            name: item.nome,
            color: item.cor || null,
            size: item.tam || null,
          },
          create: {
            sku: item.sku,
            name: item.nome,
            color: item.cor || null,
            size: item.tam || null,
            currentStock: item.qtd,
            purchasePrice: purchasePrice,
            averageCost: purchasePrice,
            sellingPrice: 0, // Novo produto sempre começa com venda zero
            unitOfMeasure: 'UN',
            categoryId: defaultCategory.id
          }
        })
        results.push(product)
      }

      console.log(`--- BULK INSERT CONCLUÍDO COM SUCESSO: ${results.length} itens ---`)
      return { message: 'Importação concluída', count: results.length }
    } catch (error: any) {
      console.error('ERRO NO BULK INSERT:', error)
      return reply.status(500).send({ 
        message: 'Erro ao processar o cadastro no banco de dados.',
        error: error.message,
        code: error.code
      })
    }
  })

  // 5. Listar Categorias
  appTyped.get('/categories', async () => {
    return await prisma.category.findMany()
  })

  // 6. Atualizar Produto
  appTyped.put('/products/:id', {
    schema: {
      params: z.object({
        id: z.string().uuid()
      }),
      body: z.object({
        name: z.string(),
        description: z.string().optional().nullable(),
        sku: z.string(),
        barcode: z.string().optional().nullable(),
        unitOfMeasure: z.string(),
        minStock: z.number(),
        maxStock: z.number().optional().nullable(),
        purchasePrice: z.number(),
        sellingPrice: z.number(),
        averageCost: z.number().optional(),
        aisle: z.string().optional().nullable(),
        shelf: z.string().optional().nullable(),
        batch: z.string().optional().nullable(),
      })
    }
  }, async (request, reply) => {
    const { id } = request.params
    const data = request.body

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      return reply.status(404).send({ message: 'Produto não encontrado.' })
    }

    const sku = data.sku.trim()
    const barcode = data.barcode?.trim() || null

    const existingSku = await prisma.product.findFirst({
      where: { 
        sku,
        id: { not: id }
      }
    })
    if (existingSku) {
      return reply.status(400).send({ message: `O SKU "${sku}" já está em uso por outro produto.` })
    }

    if (barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { 
          barcode,
          id: { not: id }
        }
      })
      if (existingBarcode) {
        return reply.status(400).send({ message: `O código de barras "${barcode}" já está em uso.` })
      }
    }

    try {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          sku: sku,
          barcode: barcode,
          unitOfMeasure: data.unitOfMeasure,
          minStock: data.minStock,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          averageCost: data.averageCost ?? product.averageCost,
          description: data.description || null,
          maxStock: data.maxStock || null,
          aisle: data.aisle || null,
          shelf: data.shelf || null,
          batch: data.batch || null,
        }
      })

      return updatedProduct
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error)
      return reply.status(500).send({ 
        message: 'Erro interno ao salvar no banco de dados.',
        error: error.message 
      })
    }
  })

  // 7. Excluir Produto
  appTyped.delete('/products/:id', {
    schema: {
      params: z.object({
        id: z.string().uuid()
      })
    }
  }, async (request, reply) => {
    const { id } = request.params

    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { movements: true }
    })
    
    if (!product) {
      return reply.status(404).send({ message: 'Product not found' })
    }

    if (product.movements.length > 0) {
      return reply.status(400).send({ message: 'Cannot delete product with existing stock movements' })
    }

    await prisma.product.delete({
      where: { id }
    })

    return reply.status(204).send()
  })
}
