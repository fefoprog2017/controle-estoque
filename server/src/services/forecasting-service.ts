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
  private static calculateForecast(product: any): ForecastResult {
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

    const totalOut = product.movements.reduce((acc: number, m: any) => acc + m.quantity, 0)
    
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

  static async getProductForecast(productId: string): Promise<ForecastResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        movements: {
          where: {
            type: 'OUT',
            createdAt: { gte: subDays(new Date(), 30) }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!product) throw new Error('Product not found')
    return this.calculateForecast(product)
  }

  static async getAllForecasts(): Promise<ForecastResult[]> {
    // OTİMİZAÇÃO: Busca todos os produtos e movimentações em uma ÚNICA query (Evita N+1)
    const products = await prisma.product.findMany({
      include: {
        movements: {
          where: {
            type: 'OUT',
            createdAt: { gte: subDays(new Date(), 30) }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    const forecasts = products.map(p => this.calculateForecast(p))

    return forecasts.sort((a, b) => {
      const statusOrder = { 'OUT_OF_STOCK': 0, 'CRITICAL': 1, 'WARNING': 2, 'STABLE': 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999)
    })
  }
}
