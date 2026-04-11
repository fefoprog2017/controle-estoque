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
        description: z.string().optional(),
        sku: z.string(),
        barcode: z.string().optional(),
        unitOfMeasure: z.string(),
        minStock: z.number().default(0),
        maxStock: z.number().optional(),
        sellingPrice: z.number().default(0),
        categoryId: z.string().uuid(),
        aisle: z.string().optional(),
        shelf: z.string().optional(),
        batch: z.string().optional(),
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
        averageCost: 0,
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
      orderBy: {
        name: 'asc'
      }
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
          sellingPrice: z.number(),
        }))
      })
    }
  }, async (request, reply) => {
    const { products } = request.body
    console.log(`--- INICIANDO BULK INSERT: ${products.length} itens ---`)

    try {
      // Buscar categoria padrão
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
        
        // Garantir que campos opcionais não quebrem o Prisma se vierem null da IA
        const product = await prisma.product.upsert({
          where: { sku: item.sku },
          update: {
            currentStock: { increment: item.qtd },
            sellingPrice: item.sellingPrice,
            name: item.nome, // Atualiza o nome também caso tenha mudado
            color: item.cor || null,
            size: item.tam || null,
          },
          create: {
            sku: item.sku,
            name: item.nome,
            color: item.cor || null,
            size: item.tam || null,
            currentStock: item.qtd,
            sellingPrice: item.sellingPrice,
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
        code: error.code // Útil para erros do Prisma como P2002
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
        description: z.string().optional(),
        sku: z.string(),
        barcode: z.string().optional(),
        unitOfMeasure: z.string(),
        minStock: z.number(),
        maxStock: z.number().optional(),
        sellingPrice: z.number(),
        aisle: z.string().optional(),
        shelf: z.string().optional(),
        batch: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    const { id } = request.params
    const data = request.body

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      return reply.status(404).send({ message: 'Product not found' })
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data
    })

    return updatedProduct
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
