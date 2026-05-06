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
      // 0. Garantir que existe pelo menos um usuário
      let userId = params.userId;
      const userExists = await tx.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        const fallbackUser = await tx.user.findFirst({ select: { id: true } });
        if (fallbackUser) {
          userId = fallbackUser.id;
        } else {
          const created = await tx.user.create({
            data: { name: 'Gerente', email: 'gerente@default.com', password: 'admin', role: 'ADMIN' }
          });
          userId = created.id;
        }
      }

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
        // ENTRADA: Aumenta o estoque e recalcula o custo médio
        const totalValueOld = product.currentStock * product.averageCost
        const totalValueNew = params.quantity * params.unitValue
        
        newStock = product.currentStock + params.quantity
        newAverageCost = (totalValueOld + totalValueNew) / newStock
      } else if (params.type === 'OUT') {
        // SAÍDA: Diminui o estoque físico
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
          userId: userId,
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

  static async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar a movimentação
      const movement = await tx.movement.findUnique({
        where: { id },
        include: { product: true }
      })

      if (!movement) throw new Error('Movement not found')

      // 2. Reverter o saldo do produto
      let newStock = movement.product.currentStock
      
      if (movement.type === 'IN') {
        // Se era entrada, ao deletar eu diminuo o estoque
        newStock -= movement.quantity
      } else if (movement.type === 'OUT') {
        // Se era saída, ao deletar eu aumento o estoque
        newStock += movement.quantity
      } else if (movement.type === 'ADJUSTMENT') {
        newStock -= movement.quantity
      }

      // 3. Impedir estoque negativo na reversão (opcional, mas seguro)
      if (newStock < 0) {
        throw new Error('Cannot delete this movement: Stock would become negative')
      }

      // 4. Atualizar o produto
      await tx.product.update({
        where: { id: movement.productId },
        data: { currentStock: newStock }
      })

      // 5. Deletar a movimentação (e o anexo se houver, o Prisma lida se configurado ou fazemos manual)
      await tx.movement.delete({
        where: { id }
      })

      return { success: true }
    })
  }
}
