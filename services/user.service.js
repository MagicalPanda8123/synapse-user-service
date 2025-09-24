import {
  createFollowRelationship,
  createUser,
  createUserPreferences,
  deleteAcceptedFollowRelationship,
  deletePendingFollowRelationship,
  deleteUserById,
  findFollowRelationship,
  findUserById,
  findUserPreferences,
  getFollowersByUserId,
  getFollowingByUserId,
  searchUsersByQuery,
  updateFollowRequestStatus,
  updateUserById,
  updateUserPreferencesByUserId,
} from '../repositories/index.js'
import { generateAvatarDownloadUrl, uploadAvatarToS3 } from './s3.service.js'

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
  return await Promise.all(users.map(addAvatarUrlToUser))
}
// ----------------------------------------------------------------------------------------------------------

// create a new user
export async function registerUser(
  accountId,
  username,
  firstName,
  lastName,
  gender
) {
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
export async function getUserProfile(userId) {
  const user = await findUserById(userId)
  return await addAvatarUrlToUser(user)
}

// update user profile (partially)
export async function updateUserProfile(userId, data) {
  return await updateUserById(userId, data)
}

// delete user profile
export async function deleteUserProfile(userId) {
  return await deleteUserById(userId)
}

// get user preferences
export async function getUserPreferences(userId) {
  return await findUserPreferences(userId)
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

  return await updateUserById(userId, { isPrivate: !user.isPrivate })
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

export async function acceptFollowRequest(followerId, followingId) {
  return await updateFollowRequestStatus(followerId, followingId, 'ACCEPTED')
}

export async function rejectFollowRequest(followerId, followingId) {
  return await deletePendingFollowRelationship(followerId, followingId)
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

export async function uploadUserAvatar(userId, fileBuffer, miemtype) {
  try {
    // UPload to S3 first
    const s3Result = await uploadAvatarToS3(userId, fileBuffer, miemtype)

    // Update user record in DB
    const updatedUser = await updateUserById(userId, {
      avatarKey: s3Result.key,
    })

    console.log(s3Result)

    return {
      avatarKey: updatedUser.avatarKey,
      s3Result,
    }
  } catch (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }
}
