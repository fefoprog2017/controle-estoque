import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { MovementService } from '../services/movement-service'
import { MovementType, OutwardReason } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'

export async function movementRoutes(app: FastifyInstance) {
  
  app.post('/movements', async (request, reply) => {
    const parts = request.parts()
    
    let fields: any = {}
    let fileInfo: any = null

    for await (const part of parts) {
      if (part.type === 'file') {
        const extension = path.extname(part.filename)
        const fileName = `${randomUUID()}${extension}`
        const savePath = path.join(__dirname, '../../uploads', fileName)
        
        await pipeline(part.file, createWriteStream(savePath))
        
        fileInfo = {
          fileName,
          originalName: part.filename,
          mimeType: part.mimetype,
          size: 0 // Simplificado para este exemplo
        }
      } else {
        fields[part.fieldname] = part.value
      }
    }

    try {
      const movement = await MovementService.create({
        productId: fields.productId,
        userId: fields.userId,
        type: fields.type as MovementType,
        quantity: Number(fields.quantity),
        unitValue: Number(fields.unitValue),
        supplierId: fields.supplierId,
        clientId: fields.clientId,
        invoiceNumber: fields.invoiceNumber,
        outwardReason: fields.outwardReason as OutwardReason,
        notes: fields.notes,
        attachment: fileInfo
      })

      return reply.status(201).send(movement)
    } catch (err: any) {
      return reply.status(400).send({ message: err.message })
    }
  })

  app.get('/movements', async () => {
    return await prisma.movement.findMany({
      include: {
        product: true,
        user: { select: { name: true } },
        attachment: true
      },
      orderBy: { createdAt: 'desc' }
    })
  })

  app.delete('/movements/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    try {
      await MovementService.delete(id)
      return reply.status(200).send({ message: 'Movement deleted successfully' })
    } catch (err: any) {
      return reply.status(400).send({ message: err.message })
    }
  })
}
