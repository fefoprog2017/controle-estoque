import fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { productRoutes } from './routes/product-routes'
import { movementRoutes } from './routes/movement-routes'
import { dashboardRoutes } from './routes/dashboard-routes'
import { reportRoutes } from './routes/report-routes'
import { aiRoutes } from './routes/ai-routes'
import { forecastingRoutes } from './routes/forecasting-routes'

export const app = fastify({
  bodyLimit: 52428800, // 50MB em bytes
  connectionTimeout: 120000, // 2 minutos
}).setValidatorCompiler(validatorCompiler).setSerializerCompiler(serializerCompiler)

app.register(cors, {
  origin: '*',
  exposedHeaders: ['Content-Disposition'] // Necessário para download de arquivos
})

app.register(multipart, {
  limits: {
    fileSize: 52428800, // 50MB
  }
})

app.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
})

app.register(productRoutes)
app.register(movementRoutes)
app.register(dashboardRoutes)
app.register(reportRoutes)
app.register(aiRoutes)
app.register(forecastingRoutes)

app.get('/health', async () => {
  return { status: 'ok' }
})
