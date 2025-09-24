import { prisma } from '../config/index.js'

export async function findFollowRelationship(followerId, followingId) {
  return await prisma.follow.findFirst({
    where: {
      followerId,
      followingId,
    },
  })
}

export async function createFollowRelationship(data) {
  return await prisma.follow.create({ data })
}

export async function updateFollowRequestStatus(
  followerId,
  followingId,
  status
) {
  const result = await prisma.follow.updateMany({
    where: { followerId, followingId, status: 'PENDING' },
    data: { status },
  })

  return result.count > 0 ? { followerId, followingId, status } : null
}

export async function deletePendingFollowRelationship(followerId, followingId) {
  const result = await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId,
      status: 'PENDING',
    },
  })

  return result.count > 0
}

export async function deleteAcceptedFollowRelationship(
  followerId,
  followingId
) {
  const result = await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId,
      status: 'ACCEPTED',
    },
  })

  return result.count > 0
}

export async function getFollowersByUserId(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  return await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: 'ACCEPTED',
    },
    select: {
      follower: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarKey: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  })
}

export async function getFollowingByUserId(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  return await prisma.follow.findMany({
    where: {
      followerId: userId,
      status: 'ACCEPTED',
    },
    select: {
      following: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarKey: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  })
}
