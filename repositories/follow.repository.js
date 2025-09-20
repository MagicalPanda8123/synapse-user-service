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
