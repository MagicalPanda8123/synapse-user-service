import { prisma } from '../config/index.js'

export async function createUserPreferences(data) {
  return await prisma.userPreferences.create({ data })
}
