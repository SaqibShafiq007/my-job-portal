import express from 'express'

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

  return app
}