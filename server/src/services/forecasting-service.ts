import { prisma } from '../lib/prisma'
import { subDays, differenceInDays } from 'date-fns'

export interface ForecastResult {
  productId: string
  sku: string
  name: string
  currentStock: number
  avgDailyConsumption: number
  daysRemaining: number | null
  predictedStockoutDate: Date | null
  status: 'STABLE' | 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK'
}

export class ForecastingService {
  static async getProductForecast(productId: string): Promise<ForecastResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        movements: {
          where: {
            type: 'OUT',
            createdAt: {
              gte: subDays(new Date(), 30) // Últimos 30 dias
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!product) throw new Error('Product not found')

    if (product.currentStock <= 0) {
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        currentStock: 0,
        avgDailyConsumption: 0,
        daysRemaining: 0,
        predictedStockoutDate: new Date(),
        status: 'OUT_OF_STOCK'
      }
    }

    const totalOut = product.movements.reduce((acc, m) => acc + m.quantity, 0)
    
    // Se não houve vendas nos últimos 30 dias
    if (totalOut === 0) {
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        currentStock: product.currentStock,
        avgDailyConsumption: 0,
        daysRemaining: null,
        predictedStockoutDate: null,
        status: 'STABLE'
      }
    }

    // Calcular dias reais com dados (desde a primeira venda no período até hoje)
    const firstSaleDate = product.movements[0].createdAt
    const daysInPeriod = Math.max(differenceInDays(new Date(), firstSaleDate), 1)
    
    const avgDailyConsumption = totalOut / daysInPeriod
    const daysRemaining = Math.floor(product.currentStock / avgDailyConsumption)
    
    const predictedStockoutDate = new Date()
    predictedStockoutDate.setDate(predictedStockoutDate.getDate() + daysRemaining)

    let status: ForecastResult['status'] = 'STABLE'
    if (daysRemaining <= 7) status = 'CRITICAL'
    else if (daysRemaining <= 15) status = 'WARNING'

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      currentStock: product.currentStock,
      avgDailyConsumption,
      daysRemaining,
      predictedStockoutDate,
      status
    }
  }

  static async getAllForecasts(): Promise<ForecastResult[]> {
    const products = await prisma.product.findMany({
      select: { id: true }
    })

    const forecasts = await Promise.all(
      products.map(p => this.getProductForecast(p.id))
    )

    return forecasts.sort((a, b) => {
      // Priorizar os críticos e com menos dias restantes
      const statusOrder = { 'OUT_OF_STOCK': 0, 'CRITICAL': 1, 'WARNING': 2, 'STABLE': 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)
    })
  }
}
