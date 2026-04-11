import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/stats', async () => {
    const products = await prisma.product.findMany()
    
    // 1. Calcular Valor Total e Quantidade Total
    const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.averageCost), 0)
    const totalItems = products.reduce((acc, p) => acc + p.currentStock, 0)

    // 2. Identificar Itens abaixo do mínimo
    const lowStockItems = products.filter(p => p.currentStock <= p.minStock).length

    // 3. Pegar últimas 5 movimentações para um mini-feed
    const recentMovements = await prisma.movement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true } } }
    })

    return {
      totalValue,
      totalItems,
      lowStockItems,
      recentMovements
    }
  })
}
