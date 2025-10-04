import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

export async function checkPrismaConnection() {
  await prisma.$connect()
  console.log('✅ [Prisma] Postgres connected')
}
