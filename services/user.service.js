import {
  createFollowRelationship,
  createUser,
  createUserPreferences,
  deleteAcceptedFollowRelationship,
  deleteFollowById,
  deletePendingFollowRelationship,
  deleteUserById,
  findFollowById,
  findFollowRelationship,
  findUserById,
  findUserByIdWithCounts,
  findUserPreferences,
  getFollowersByUserId,
  getFollowingByUserId,
  getPendingRequestCountByUserId,
  getPendingRequestsByUserId,
  searchUsersByQuery,
  updateFollowRequestStatus,
  updateFollowStatusById,
  updateUserById,
  updateUserPreferencesByUserId,
} from '../repositories/index.js'
import { generateAvatarDownloadUrl, uploadAvatarToS3 } from './s3.service.js'
import * as userRepo from '../repositories/user.repository.js'
import * as followRepo from '../repositories/follow.repository.js'
import { publishUsernameChanged } from '../events/publishers/user.publisher.js'

// HELPER FUNCTIONS -----------------------------------------------------------------------------------------
async function addAvatarUrlToUser(user) {
  let avatarUrl = null
  if (user.avatarKey) {
    avatarUrl = await generateAvatarDownloadUrl(user.avatarKey, 1800)
  }

  return {
    ...user,
    avatarUrl,
  }
}

async function addAvatarUrlToUsers(users) {
  return await Promise.all(
    users.map(async (user) => {
      const avatarUrl = await generateAvatarDownloadUrl(user.avatarKey, 1800)
      return {
        ...user,
        avatarUrl,
      }
    })
  )
}

// Get follow relationship status between two users
async function getFollowRelationshipStatus(requesterId, targetUserId) {
  if (!requesterId || requesterId === targetUserId) {
    return null
  }

  try {
    // Check if requester follows target
    const requesterFollowsTarget = await findFollowRelationship(requesterId, targetUserId)

    // Check if target follows requester
    const targetFollowsRequester = await findFollowRelationship(targetUserId, requesterId)

    return {
      requesterToTarget: requesterFollowsTarget || null,
      targetToRequester: targetFollowsRequester || null,
    }
  } catch (error) {
    console.error('Error checking follow relationship:', error)
    return null
  }
}
// ----------------------------------------------------------------------------------------------------------

// create a new user
export async function registerUser(accountId, username, firstName, lastName, gender) {
  // Ensure gender is uppercase to match Prisma enum
  const genderEnum = typeof gender === 'string' ? gender.toUpperCase() : gender

  // create a new user record in the database
  const newUser = await createUser({
    accountId,
    username,
    firstName,
    lastName,
    gender: genderEnum,
  })

  // create the user's preferences record (with default values)
  await createUserPreferences({ userId: newUser.id })

  return newUser
}

// get user profile
export async function getUserProfile(userId, targetUserId) {
  const user = await userRepo.findUserByIdWithCounts(targetUserId)
  if (!user) {
    return null
  }

  // Retrieve avatar signed-URL (if exists)
  let avatarUrl = await generateAvatarDownloadUrl(user.avatarKey, 1800)

  // get follow relationship if userId is provided (authenticated user)
  let relationshipStatus = null
  if (userId && userId !== targetUserId) {
    relationshipStatus = await getFollowRelationshipStatus(userId, targetUserId)
  }

  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender,
    bio: user.bio,
    location: user.location,
    avatarUrl,
    isPrivate: user.isPrivate,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    relationshipStatus,
    createdAt: user.createdAt,
  }
}

// update user profile (partially)
export async function updateUserProfile(userId, data) {
  const currentUser = await userRepo.findUserById(userId)
  const updatedUser = await updateUserById(userId, data)
  const avatarUrl = await generateAvatarDownloadUrl(updatedUser.avatarKey, 1800)

  if (data.username && data.username !== currentUser.username) {
    await publishUsernameChanged(userId, data.username)
  }

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    gender: updatedUser.gender,
    bio: updatedUser.bio,
    location: updatedUser.location,
    avatarUrl,
    isPrivate: updatedUser.isPrivate,
  }
}

// delete user profile
export async function deleteUserProfile(userId) {
  return await deleteUserById(userId)
}

// get user preferences
export async function getUserPreferences(userId) {
  const userPreferences = await findUserPreferences(userId)
  const { id, userId: _userId, createdAt, updatedAt, ...filtered } = userPreferences
  return filtered
}

// update user preferences
export async function updateUserPreferences(userId, data) {
  return await updateUserPreferencesByUserId(userId, data)
}

export async function searchUsers(query, cursor, limit) {
  // Fetch (limit + 1) users to check if there's more
  const result = await searchUsersByQuery(query, cursor, limit + 1)
  const users = await addAvatarUrlToUsers(result.slice(0, limit))
  const formattedUsers = users.map((user) => {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isPrivate: user.isPrivate,
      followerCount: user._count.followers,
    }
  })

  // Cursor pagination logic
  const hasMore = result.length > limit
  const nextCursor = hasMore ? result[limit - 1].id : null

  return {
    users: formattedUsers,
    pagination: {
      hasMore,
      nextCursor,
    },
  }
}

export async function toggleUserPrivacy(userId) {
  const user = await findUserById(userId)
  if (!user) return null

  const updatedUser = await updateUserById(userId, {
    isPrivate: !user.isPrivate,
  })
  return {
    id: updatedUser.id,
    isPrivate: updatedUser.isPrivate,
  }
}

export async function followUser(followerId, followingId) {
  // check if target user exists
  const targetUser = await findUserById(followingId)
  if (!targetUser) return null

  // check if already following
  const existingFollow = await findFollowRelationship(followerId, followingId)
  if (existingFollow) {
    throw new Error('Already requesting or following this user')
  }

  // determine follow status
  const status = targetUser.isPrivate ? 'PENDING' : 'ACCEPTED'

  return await createFollowRelationship({ followerId, followingId, status })
}

export async function acceptFollowRequestById(userId, followId) {
  const follow = await findFollowById(followId)
  if (!follow) return null
  if (follow.followingId !== userId) throw new Error('Forbidden: not yours to decide twin')
  if (follow.status !== 'PENDING') throw new Error("it ain't pending bro")
  return await updateFollowStatusById(followId, 'ACCEPTED')
}

export async function rejectFollowRequestById(userId, followId) {
  const follow = await findFollowById(followId)
  if (!follow) return null
  if (follow.followingId !== userId) throw new Error('Forbidden: not your follow request')
  if (follow.status !== 'PENDING') throw new Error('Cannot reject a non-pending request')
  await deleteFollowById(followId)
  return true
}

// export async function cancelFollowRequest(followerId, followingId) {
//   return await deletePendingFollowRelationship(followerId, followingId)
// }

export async function deleteFollowByUserId(userId, followId) {
  const follow = await followRepo.findFollowById(followId)
  if (!follow) {
    return null
  }

  if (follow.followerId !== userId) {
    throw new Error('Forbidden: not yours to decide bro')
  }

  return await followRepo.deleteFollowById(followId)
}

export async function getFollowers(targetUserId, requesterId, cursor, limit) {
  const targetUser = await userRepo.findUserById(targetUserId)
  if (!targetUser) throw new Error('User not found')

  const isSelf = requesterId && requesterId === targetUserId

  // Privacy check
  if (targetUser.isPrivate && !isSelf) {
    if (!requesterId) throw new Error('This user is private')
    const relationship = await followRepo.findFollowRelationship(requesterId, targetUserId)
    if (!relationship || relationship.status !== 'ACCEPTED') {
      throw new Error('This profile is private, you must follow to view their followers')
    }
  }

  const result = await getFollowersByUserId(targetUserId, cursor, limit + 1)
  const follows = result.slice(0, limit)

  // FIX: Use Promise.all to resolve avatar URLs
  const formattedFollows = await Promise.all(
    follows.map(async (follow) => {
      const avatarUrl = await generateAvatarDownloadUrl(follow.follower.avatarKey, 1800)
      return {
        id: follow.id,
        follower: {
          id: follow.follower.id,
          username: follow.follower.username,
          firstName: follow.follower.firstName,
          lastName: follow.follower.lastName,
          avatarUrl,
        },
        createdAt: follow.createdAt,
      }
    })
  )

  const hasMore = result.length > limit
  const nextCursor = hasMore ? result[limit - 1].id : null

  return {
    follows: formattedFollows,
    pagination: {
      hasMore,
      nextCursor,
    },
  }
}

export async function getFollowing(targetUserId, requesterId, cursor, limit) {
  const targetUser = await userRepo.findUserById(targetUserId)
  if (!targetUser) throw new Error('User not found')

  const isSelf = requesterId && requesterId === targetUserId

  // Privacy check
  if (targetUser.isPrivate && !isSelf) {
    if (!requesterId) throw new Error('This user is private')
    const relationship = await followRepo.findFollowRelationship(requesterId, targetUserId)
    if (!relationship || relationship.status !== 'ACCEPTED') {
      throw new Error('This profile is private, you must follow to view their following')
    }
  }

  const result = await getFollowingByUserId(targetUserId, cursor, limit + 1)
  const follows = result.slice(0, limit)

  // FIX: Use Promise.all to resolve avatar URLs
  const formattedFollowing = await Promise.all(
    follows.map(async (follow) => {
      const avatarUrl = await generateAvatarDownloadUrl(follow.following.avatarKey, 1800)
      return {
        id: follow.id,
        following: {
          id: follow.following.id,
          username: follow.following.username,
          firstName: follow.following.firstName,
          lastName: follow.following.lastName,
          avatarUrl,
        },
        createdAt: follow.createdAt,
      }
    })
  )

  const hasMore = result.length > limit
  const nextCursor = hasMore ? result[limit - 1].id : null

  return {
    following: formattedFollowing,
    pagination: {
      hasMore,
      nextCursor,
    },
  }
}

// Get pending follow requests for a user
export async function getPendingFollowRequests(userId, cursor, limit = 10) {
  const requests = await getPendingRequestsByUserId(userId, cursor, limit + 1)

  // Add avatar URLs to the requesters
  const requestsWithAvatars = await Promise.all(
    requests.slice(0, limit).map(async (request) => {
      const avatarUrl = await generateAvatarDownloadUrl(request.follower.avatarKey)
      return {
        id: request.id,
        createdAt: request.createdAt,
        requester: {
          id: request.follower.id,
          username: request.follower.username,
          firstName: request.follower.firstName,
          lastName: request.follower.lastName,
          avatarUrl: avatarUrl,
        },
      }
    })
  )

  const hasMore = requests.length > limit
  const nextCursor = hasMore ? requests[limit - 1].id : null

  return {
    requests: requestsWithAvatars,
    pagination: {
      hasMore,
      nextCursor,
    },
  }
}

export async function uploadUserAvatar(userId, fileBuffer, miemtype) {
  try {
    // UPload to S3 first
    const s3Result = await uploadAvatarToS3(userId, fileBuffer, miemtype)

    // Update user record in DB
    const updatedUser = await updateUserById(userId, {
      avatarKey: s3Result.key,
    })

    console.log(s3Result)
    const avatarUrl = await generateAvatarDownloadUrl(updatedUser.avatarKey)

    return {
      avatarUrl,
      s3Result,
    }
  } catch (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }
}

export async function getSimpleUserProfile(userId) {
  return await userRepo.findSimpleUserProfileById(userId)
}

export async function getSimpleUserProfiles(userIds) {
  const profiles = await userRepo.findSimpleUserProfilesByIds(userIds)
  const result = await Promise.all(
    profiles.map(async (profile) => ({
      id: profile.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: await generateAvatarDownloadUrl(profile.avatarKey),
    }))
  )
  return result
}
