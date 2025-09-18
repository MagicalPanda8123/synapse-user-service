import { createUser, createUserPreferences } from '../repositories/index.js'

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
