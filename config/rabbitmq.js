import amqp from 'amqplib'

let connection = null

const RETRY_INTERVAL_MS = 5000
const MAX_RETRIES = 5

async function connectWithRetry(retries = 0) {
  try {
    if (!process.env.RABBITMQ_URL) throw new Error('RABBIT_MQ is not set in .env')
    const conn = await amqp.connect(process.env.RABBITMQ_URL)
    console.log('✅ [RabbitMQ] Successfully connected ')
    return conn
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.warn(`RabbitMQ connection failed (attempt ${retries}). Retrying in ${RETRY_INTERVAL_MS / 1000}s...`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS))
      return connectWithRetry(retries + 1)
    }
    throw new Error(`Failed to connect to RabbitMQ after ${MAX_RETRIES} attempts. Error: ` + error.message)
  }
}

export async function getRabbitMQConnection() {
  if (connection) return connection
  connection = await connectWithRetry()
  return connection
}

export async function getRabbitMQChannel() {
  const conn = await getRabbitMQConnection()
  return conn.createChannel()
}

export async function closeRabbitMQConnection() {
  if (connection) {
    try {
      await connection.close()
      console.log('RabbitMQ connection closed.')
    } catch (error) {
      console.error('Error closing RabbitMQ connection: ', error)
    }
    connection = null
  }
}

process.on('SIGINT', async () => {
  await closeRabbitMQConnection()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeRabbitMQConnection()
  process.exit(0)
})
