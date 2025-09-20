import {
  acceptFollowRequest,
  cancelFollowRequest,
  followUser,
  getFollowers,
  getFollowing,
  getUserPreferences,
  getUserProfile,
  registerUser,
  rejectFollowRequest,
  searchUsers,
  toggleUserPrivacy,
  unfollowUser,
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
    const userId = req.user.sub

    // check if the sub in the JWT matches with the id passed in the route param
    if (userId != req.params.id) {
      return res
        .status(403)
        .json({ error: "Forbidden: cannot update another user's profile" })
    }
    const data = req.validatedBody
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

export async function searchUsersController(req, res, next) {
  try {
    const { name, page = 1, limit = 10 } = req.query
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Missing search query' })
    }
    const users = await searchUsers(name, parseInt(page), parseInt(limit))
    res.json(users)
  } catch (error) {
    next(error)
  }
}

export async function toggleUserPrivacyController(req, res, next) {
  try {
    const userId = req.user.sub
    if (userId !== req.params.id) {
      return res.status(403).json({
        error: "Forbidden: Cannot modify other user's privacy setting",
      })
    }
    const updatedUser = await toggleUserPrivacy(userId)
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: updatedUser.id,
      isPrivate: updatedUser.isPrivate,
    })
  } catch (error) {
    next(error)
  }
}

export async function followUserController(req, res, next) {
  try {
    const followerId = req.user.sub
    const followingId = req.params.id

    // prevent self-following
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself twin </3' })
    }

    const result = await followUser(followerId, followingId)

    if (!result) {
      return res.status(404).json({ error: 'User not found' })
    }

    const message =
      result.status === 'PENDING'
        ? 'Follow request sent'
        : 'User followed successfully'

    res.status(201).json({ message, status: result.status })
  } catch (error) {
    if (error.message === 'Already requesting or following this user') {
      return res.status(409).json({ error: error.message })
    }
    next(error)
  }
}

export async function acceptFollowRequestController(req, res, next) {
  try {
    const userId = req.user.sub // the user accepting the request
    const followerId = req.params.id // the user who requests

    const result = await acceptFollowRequest(followerId, userId)

    if (!result) {
      return res.status(404).json({ error: 'Follow request not found' })
    }

    res.json({ message: 'Follow request accepted' })
  } catch (error) {
    next(error)
  }
}

export async function rejectFollowRequestController(req, res, next) {
  try {
    const userId = req.user.sub
    const followerId = req.params.id

    const result = await rejectFollowRequest(followerId, userId)

    if (!result) {
      return res.status(404).json({ error: 'Follow request not found' })
    }

    res.status(204).send() // no content - request (follow record) was deleted
  } catch (error) {
    next(error)
  }
}

export async function cancelFollowRequestController(req, res, next) {
  try {
    const followerId = req.user.sub
    const followingId = req.params.id

    const result = await cancelFollowRequest(followerId, followingId)

    if (!result) {
      return res.status(404).json({ error: 'Follow request not found' })
    }

    res.status(204).send() // no content - request (follow record) was deleted
  } catch (error) {
    next(error)
  }
}

export async function unfollowController(req, res, next) {
  try {
    const followerId = req.user.sub
    const followingId = req.params.id

    const result = await unfollowUser(followerId, followingId)

    if (!result) {
      return res.status(404).json({ error: 'Follow relationship not found' })
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function getFollowersController(req, res, next) {
  try {
    const userId = req.user.sub
    const { page = 1, limit = 20 } = req.query

    const followers = await getFollowers(
      userId,
      parseInt(page),
      parseInt(limit)
    )
    res.json(followers)
  } catch (error) {
    next(error)
  }
}

export async function getFollowingController(req, res, next) {
  try {
    const userId = req.user.sub
    const { page = 1, limit = 20 } = req.query

    const following = await getFollowing(
      userId,
      parseInt(page),
      parseInt(limit)
    )
    res.json(following)
  } catch (error) {
    next(error)
  }
}
