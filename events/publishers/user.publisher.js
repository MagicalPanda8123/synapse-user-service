import { getRabbitMQChannel } from '../../config/rabbitmq.js'

const EXCHANGE = 'user'

export async function publishUsernameChanged(userId, newUsername) {
  const channel = await getRabbitMQChannel()
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

  const routingKey = 'user.username.changed'
  const payload = { userId, newUsername }
  const buffer = Buffer.from(JSON.stringify(payload))

  // publish message
  const success = channel.publish(EXCHANGE, routingKey, buffer, { persistent: true })

  if (success) {
    console.log(`📤 Published username changed event for userId=${userId}, newUsername="${newUsername}"`)
  } else {
    console.error('❌ Failed to publish username changed event')
  }
}
