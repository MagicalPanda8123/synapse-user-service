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

// search users by query (ordered by amount of followers) with pagination
export async function searchUsersByQuery(query, page = 1, limit = 10) {
  const skip = (page - 1) * limit

  return await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      _count: {
        select: { followers: true },
      },
    },
    orderBy: {
      followers: {
        _count: 'desc',
      },
    },
    skip,
    take: limit,
  })
}
