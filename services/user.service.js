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
  updateUserPreferencesByUserId
} from '../repositories/index.js'
import { generateAvatarDownloadUrl, uploadAvatarToS3 } from './s3.service.js'
import * as userRepo from '../repositories/user.repository.js'

// HELPER FUNCTIONS -----------------------------------------------------------------------------------------
async function addAvatarUrlToUser(user) {
  let avatarUrl = null
  if (user.avatarKey) {
    avatarUrl = await generateAvatarDownloadUrl(user.avatarKey, 1800)
  }

  return {
    ...user,
    avatarUrl
  }
}

async function addAvatarUrlToUsers(users) {
  return await Promise.all(users.map(addAvatarUrlToUser))
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
      isFollowing: requesterFollowsTarget?.status === 'ACCEPTED',
      isRequested: requesterFollowsTarget?.status === 'PENDING',
      followsYou: targetFollowsRequester?.status === 'ACCEPTED',
      requestsYou: targetFollowsRequester?.status === 'PENDING'
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
    gender: genderEnum
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
    relationshipStatus
  }
}

// update user profile (partially)
export async function updateUserProfile(userId, data) {
  const updatedUser = await updateUserById(userId, data)
  const avatarUrl = await generateAvatarDownloadUrl(updatedUser.avatarKey, 1800)

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    gender: updatedUser.gender,
    bio: updatedUser.bio,
    location: updatedUser.location,
    avatarUrl,
    isPrivate: updatedUser.isPrivate
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

export async function searchUsers(query, page, limit) {
  const users = await searchUsersByQuery(query, page, limit)
  return await addAvatarUrlToUsers(users)
}

export async function toggleUserPrivacy(userId) {
  const user = await findUserById(userId)
  if (!user) return null

  const updatedUser = await updateUserById(userId, { isPrivate: !user.isPrivate })
  return {
    id: updatedUser.id,
    isPrivate: updatedUser.isPrivate
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

export async function cancelFollowRequest(followerId, followingId) {
  return await deletePendingFollowRelationship(followerId, followingId)
}

export async function unfollowUser(followerId, followingId) {
  return await deleteAcceptedFollowRelationship(followerId, followingId)
}

export async function getFollowers(userId, page, limit) {
  const followers = await getFollowersByUserId(userId, page, limit)
  return await addAvatarUrlToUsers(followers)
}

export async function getFollowing(userId, page, limit) {
  const following = await getFollowingByUserId(userId, page, limit)
  return await addAvatarUrlToUsers(following)
}

// Get pending follow requests for a user
export async function getPendingFollowRequests(userId, page = 1, limit = 10) {
  const requests = await getPendingRequestsByUserId(userId, page, limit)
  const totalCount = await getPendingRequestCountByUserId(userId)

  // Add avatar URLs to the requesters
  const requestsWithAvatars = await Promise.all(
    requests.map(async (request) => {
      const followerWithAvatar = await addAvatarUrlToUser(request.follower)
      return {
        id: request.id,
        createdAt: request.createdAt,
        requester: followerWithAvatar
      }
    })
  )

  return {
    requests: requestsWithAvatars,
    totalCount,
    currentPage: page,
    totalCount
  }
}
export async function uploadUserAvatar(userId, fileBuffer, miemtype) {
  try {
    // UPload to S3 first
    const s3Result = await uploadAvatarToS3(userId, fileBuffer, miemtype)

    // Update user record in DB
    const updatedUser = await updateUserById(userId, {
      avatarKey: s3Result.key
    })

    console.log(s3Result)

    return {
      avatarKey: updatedUser.avatarKey,
      s3Result
    }
  } catch (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }
}
