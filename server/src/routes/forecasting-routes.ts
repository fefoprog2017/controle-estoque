import { FastifyInstance } from 'fastify'
import { ForecastingService } from '../services/forecasting-service'

export async function forecastingRoutes(app: FastifyInstance) {
  app.get('/forecasting/stats', async () => {
    return await ForecastingService.getAllForecasts()
  })

  app.get('/forecasting/product/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      return await ForecastingService.getProductForecast(id)
    } catch (err: any) {
      return reply.status(404).send({ message: err.message })
    }
  })
}
