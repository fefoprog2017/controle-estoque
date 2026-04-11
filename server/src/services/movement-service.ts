import { prisma } from '../lib/prisma'
import { MovementType } from '@prisma/client'

interface CreateMovementParams {
  productId: string
  userId: string
  type: MovementType
  quantity: number
  unitValue: number
  supplierId?: string
  clientId?: string
  invoiceNumber?: string
  outwardReason?: any
  notes?: string
  attachment?: {
    fileName: string
    originalName: string
    mimeType: string
    size: number
  }
}

export class MovementService {
  static async create(params: CreateMovementParams) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar o produto
      const product = await tx.product.findUnique({
        where: { id: params.productId }
      })

      if (!product) throw new Error('Product not found')

      // 2. Validação de estoque negativo para saídas
      if (params.type === 'OUT' && product.currentStock < params.quantity) {
        throw new Error('Insufficient stock for this operation')
      }

      // 3. Calcular novos valores do produto
      let newStock = product.currentStock
      let newAverageCost = product.averageCost

      if (params.type === 'IN') {
        // Recalcular Custo Médio: (Estoque Atual * Custo Atual + Qtd Nova * Custo Novo) / (Estoque Atual + Qtd Nova)
        const totalValueOld = product.currentStock * product.averageCost
        const totalValueNew = params.quantity * params.unitValue
        newStock += params.quantity
        newAverageCost = (totalValueOld + totalValueNew) / newStock
      } else if (params.type === 'OUT') {
        newStock -= params.quantity
      } else if (params.type === 'ADJUSTMENT') {
        // No ajuste, a quantidade enviada é a nova quantidade absoluta ou relativa? 
        // Vamos considerar como relativo (positivo soma, negativo subtrai)
        newStock += params.quantity
      }

      // 4. Criar a movimentação
      const movement = await tx.movement.create({
        data: {
          type: params.type,
          quantity: params.quantity,
          unitValue: params.unitValue,
          totalValue: params.quantity * params.unitValue,
          productId: params.productId,
          userId: params.userId,
          supplierId: params.supplierId,
          clientId: params.clientId,
          invoiceNumber: params.invoiceNumber,
          outwardReason: params.outwardReason,
          notes: params.notes,
          attachment: params.attachment ? {
            create: {
              fileName: params.attachment.fileName,
              originalName: params.attachment.originalName,
              mimeType: params.attachment.mimeType,
              size: params.attachment.size,
              url: `/uploads/${params.attachment.fileName}`
            }
          } : undefined
        }
      })

      // 5. Atualizar o produto
      await tx.product.update({
        where: { id: params.productId },
        data: {
          currentStock: newStock,
          averageCost: newAverageCost
        }
      })

      return movement
    })
  }
}
