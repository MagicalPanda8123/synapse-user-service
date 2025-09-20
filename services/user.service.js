import {
  createFollowRelationship,
  createUser,
  createUserPreferences,
  deleteAcceptedFollowRelationship,
  deletePendingFollowRelationship,
  findFollowRelationship,
  findUserById,
  findUserPreferences,
  searchUsersByQuery,
  updateFollowRequestStatus,
  updateUserById,
  updateUserPreferencesByUserId,
} from '../repositories/index.js'

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
  return await findUserById(userId)
}

// update user profile (partially)
export async function updateUserProfile(userId, data) {
  return await updateUserById(userId, data)
}

// delete user profile
export async function deleteUserProfile(userId) {
  return await deleteUserProfile(userId)
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
  return await searchUsersByQuery(query, page, limit)
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
