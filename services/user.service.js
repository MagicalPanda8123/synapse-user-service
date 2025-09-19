import {
  createUser,
  createUserPreferences,
  findUserById,
  findUserPreferences,
  updateUserById,
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
