import { prisma } from '../config/index.js'

export async function createUser(data) {
  return await prisma.user.create({ data })
}

export async function findUserById(id) {
  return await prisma.user.findUnique({ where: { id } })
}

export async function findUserByIdWithCounts(id) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          followers: { where: { status: 'ACCEPTED' } },
          following: { where: { status: 'ACCEPTED' } },
        },
      },
    },
  })
}

export async function updateUserById(id, data) {
  return await prisma.user.update({ where: { id }, data })
}

export async function deleteUserById(id) {
  return await prisma.user.delete({ where: { id } })
}

// search users by query (ordered by amount of followers) with pagination
export async function searchUsersByQuery(query, cursor, limit = 10) {
  const prismaQuery = {
    where: {
      OR: [{ username: { contains: query, mode: 'insensitive' } }, { firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }],
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarKey: true,
      isPrivate: true,
      _count: {
        select: { followers: true },
      },
    },
    orderBy: {
      followers: {
        _count: 'desc',
      },
    },
    take: limit,
  }

  // If cursor is provided, use it for pagination
  if (cursor) {
    prismaQuery.cursor = { id: cursor }
    prismaQuery.skip = 1
  }

  return await prisma.user.findMany(prismaQuery)
}

export async function findSimpleUserProfileById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatarKey: true },
  })
}

export async function findSimpleUserProfilesByIds(userIds) {
  return await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarKey: true, firstName: true, lastName: true },
  })
}
