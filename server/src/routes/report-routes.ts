import { FastifyInstance } from 'fastify'
import { ReportService } from '../services/report-service'

export async function reportRoutes(app: FastifyInstance) {
  app.get('/reports/stock-position', async (request, reply) => {
    try {
      const pdfBuffer = await ReportService.generateStockPositionPDF()

      return reply
        .type('application/pdf')
        .header('Content-Disposition', 'attachment; filename="posicao-estoque.pdf"')
        .send(pdfBuffer)
    } catch (error: any) {
      return reply.status(500).send({ message: 'Erro ao gerar relatório', error: error.message })
    }
  })
}
