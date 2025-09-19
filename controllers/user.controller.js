import {
  getUserPreferences,
  getUserProfile,
  registerUser,
  updateUserPreferences,
  updateUserProfile,
} from '../services/index.js'

export async function registerUserController(req, res, next) {
  try {
    // verify internal JWT claims
    const service = req.service
    if (
      !service ||
      service.iss !== 'auth-service' ||
      !service.permissions ||
      !service.permissions.includes('users:create')
    ) {
      return res
        .status(403)
        .json({ error: 'Forbidden: insufficient permissions' })
    }

    // verify POST payload
    const { account_id, username, first_name, last_name, gender } = req.body
    if (!account_id || !username) {
      return res
        .status(400)
        .json({ error: 'account_id and username are required' })
    }
    const newUser = await registerUser(
      account_id,
      username,
      first_name,
      last_name,
      gender
    )
    res.json(newUser)
  } catch (error) {
    next(error)
  }
}

// get a user profile by id
export async function getUserProfileController(req, res, next) {
  try {
    const userId = req.params.id
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    const user = await getUserProfile(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
}

export async function updateUserProfileController(req, res, next) {
  try {
    const { sub: userId } = req.user

    // check if the sub in the JWT matches with the id passed in the route param
    if (userId != req.params.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: cannot update another user's profile" })
    }
    const data = {}
    const allowedFields = [
      'username',
      'firstName',
      'lastName',
      'bio',
      'location',
      'avatarUrl',
      'gender',
      'isPrivate',
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field]
      }
    }

    const updatedUser = await updateUserProfile(userId, data)
    res.json(updatedUser)
  } catch (error) {
    if (
      // catch and handle username duplication
      error.code === 'P2002' &&
      error.meta &&
      error.meta.target &&
      error.meta.target.includes('username')
    ) {
      return res.status(409).json({ error: 'Username already exists.' })
    }
    next(error)
  }
}

// export async function deleteUserProfileController(req, res, next) {
//   try {
//     const service = req.service
//     if (
//       !service ||
//       service.iss !== 'auth-service' ||
//       !service.permissions ||
//       !service.permissions.includes('users:delete')
//     ) {
//       return res
//         .status(403)
//         .json({ error: 'Forbidden: insufficient permissions' })
//     }
//   } catch (error) {}
// }

export async function getUserPreferencesController(req, res, next) {
  try {
    const userId = req.user.sub
    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: missing user identifier' })
    }
    if (userId !== req.params.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: cannot get another user's profile" })
    }
    const userPreferences = await getUserPreferences(userId)
    // excluding unnecessary fields
    const {
      id,
      userId: _userId,
      createdAt,
      updatedAt,
      ...filtered
    } = userPreferences
    res.json(filtered)
  } catch (error) {
    next(error)
  }
}

export async function updateUserPreferencesController(req, res, next) {
  try {
    const userId = req.user.sub

    // check if the sub and the id in the route param match
    if (userId !== req.params.id) {
      return res
        .status(403)
        .json({ error: "Cannot update another user's preferences" })
    }
    // get the already validated body (from validate middleware)
    const preferences = req.validatedBody
    const upadted = await updateUserPreferences(userId, preferences)

    // filter fields to make response more compact
    const { id, userId: _userId, createdAt, updatedAt, ...filtered } = upadted
    res.json(filtered)
  } catch (error) {
    next(error)
  }
}
