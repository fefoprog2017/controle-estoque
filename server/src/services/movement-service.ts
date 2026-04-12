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
        // ENTRADA: Conforme solicitado, entrada não altera estoque físico (foi subido via Subir Base)
        // Apenas mantemos o registro para histórico de compra
        console.log('Movimentação de Entrada registrada apenas para histórico.')
      } else if (params.type === 'OUT') {
        // SAÍDA: Diminui o estoque conforme a quantidade movimentada
        newStock -= params.quantity
      } else if (params.type === 'ADJUSTMENT') {
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
          // Corrigindo FK: Se o ID vier vazio ou string vazia, deve ser null para não violar constraint
          supplierId: params.supplierId && params.supplierId !== "undefined" && params.supplierId !== "" ? params.supplierId : null,
          clientId: params.clientId && params.clientId !== "undefined" && params.clientId !== "" ? params.clientId : null,
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
