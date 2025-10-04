// import environment variables
import 'dotenv/config'

import app from './app.js'
import { checkPrismaConnection } from './config/prisma.js'
import { getRabbitMQConnection } from './config/rabbitmq.js'

async function startServer() {
  try {
    await checkPrismaConnection()
    await getRabbitMQConnection()
    // Future: connect to RabbitMQ, Redis, etc.

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`👤 User service running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()
