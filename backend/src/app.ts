import express from 'express'
import { errorHandler } from './shared/error-handler'
import { NotFoundError } from './shared/errors'
import { ValidationError } from './shared/validate'
import { authRouter } from './modules/auth/auth.routes';
import { companiesRouter } from './modules/companies/companies.routes';
import { applicantsRouter } from './modules/applicants/applicants.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { jobsRouter } from './modules/jobs/jobs.routes';
import { z } from 'zod'
import { publicRouter } from './modules/public/publicRouter';

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
  app.use('/api/public', publicRouter);
  app.use('/auth', authRouter);
  app.use('/api/companies', companiesRouter);
  app.use('/api/applicants', applicantsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/jobs', jobsRouter);

  app.use(errorHandler)

  return app
}