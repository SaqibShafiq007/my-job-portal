import express from 'express'
import { errorHandler } from './shared/error-handler'
import { NotFoundError } from './shared/errors'
import { ValidationError } from './shared/validate'
import { z } from 'zod'

export function buildApp() {
  const app = express()

  app.use(express.json())

  // Infrastructure
  app.get('/health', async (req, res) => {
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  // Feature routes registered in later chapters
  // app.use('/auth', authRoutes)
  // app.use('/jobs', jobRoutes)

  // Temporary test routes — remove after verifying the error handler
  app.get('/test/not-found', (_req, _res, next) => {
    next(new NotFoundError('Job not found'))
  })

  app.get('/test/validation', (_req, _res, next) => {
    const schema = z.object({ title: z.string().min(1) })
    const result = schema.safeParse({})
    if (!result.success) {
      next(new ValidationError(result.error))
    } else {
      next(new Error('Unexpected: schema should have failed'))
    }
  })

  app.get('/test/unhandled', (_req, _res, next) => {
    next(new Error('oops — raw error'))
  })

  app.use(errorHandler)

  return app
}