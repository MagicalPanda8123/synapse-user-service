import { prisma } from '../config/index.js'

export async function createUser(data) {
  return await prisma.user.create({ data })
}

export async function findUserById(id) {
  return await prisma.user.findUnique({ where: { id } })
}

export async function updateUserById(id, data) {
  return await prisma.user.update({ where: { id }, data })
}

export async function deleteUserById(id) {
  return await prisma.user.delete({ where: { id } })
}
