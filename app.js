import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import os from 'os'
import routes from './routes/index.js'
import { prisma } from './config/index.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

// Security middlewares
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'authorization', 'Content-Type'],
  })
)
app.use(helmet())
app.use(cookieParser())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,PUT,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  next()
})

// built-in middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// health check route
app.get('/health', async (req, res) => {
  try {
    // check DB connection
    await prisma.$queryRaw`SELECT 1`

    // other checks (RabbitMQ, Redis...)

    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      hostname: os.hostname(),
      timeStamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({ status: 'failed', error: error.message })
  }
})

// API routes
app.use('/api', routes)

// Error handling
app.use(errorHandler)

export default app
