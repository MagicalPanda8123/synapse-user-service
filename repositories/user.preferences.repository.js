import { prisma } from '../config/index.js'

export async function createUserPreferences(data) {
  return await prisma.userPreferences.create({ data })
}

export async function findUserPreferences(userId) {
  return await prisma.userPreferences.findUnique({ where: { userId } })
}

export async function updateUserPreferencesByUserId(userId, data) {
  return await prisma.userPreferences.update({ where: { userId }, data })
}
