import { prisma } from '../config/index.js'

export async function createUser(data) {
  return await prisma.user.create({ data })
}
