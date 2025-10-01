import {
  followUser,
  getFollowers,
  getFollowing,
  getPendingFollowRequests,
  getUserPreferences,
  getUserProfile,
  registerUser,
  searchUsers,
  toggleUserPrivacy,
  updateUserPreferences,
  updateUserProfile,
  uploadUserAvatar,
} from '../services/index.js'

import * as userService from '../services/user.service.js'

export async function registerUserController(req, res, next) {
  try {
    // verify internal JWT claims
    const service = req.service
    if (!service || service.iss !== 'auth-service' || !service.permissions || !service.permissions.includes('users:create')) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
    }

    // verify POST payload
    const { account_id, username, first_name, last_name, gender } = req.body
    if (!account_id || !username) {
      return res.status(400).json({ error: 'account_id and username are required' })
    }
    const newUser = await registerUser(account_id, username, first_name, last_name, gender)
    res.json(newUser)
  } catch (error) {
    next(error)
  }
}

// get a user profile by id
export async function getUserProfileController(req, res, next) {
  try {
    const userId = req.user?.sub
    const targetUserId = req.params.userId
    if (!targetUserId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    const user = await getUserProfile(userId, targetUserId)
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
    const userPreferences = await getUserPreferences(userId)
    res.json(userPreferences)
  } catch (error) {
    next(error)
  }
}

export async function updateUserPreferencesController(req, res, next) {
  try {
    const userId = req.user.sub
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

export async function getUsersController(req, res, next) {
  try {
    const { q, cursor, limit = 10 } = req.query
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Missing quer)' })
    }
    const users = await searchUsers(q, cursor, parseInt(limit))
    res.json(users)
  } catch (error) {
    next(error)
  }
}

export async function toggleUserPrivacyController(req, res, next) {
  try {
    const userId = req.user.sub

    const updatedUser = await toggleUserPrivacy(userId)
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(updatedUser)
  } catch (error) {
    next(error)
  }
}

export async function followUserController(req, res, next) {
  try {
    const followerId = req.user.sub
    const followingId = req.body.userId

    if (!followingId) {
      return res.status(400).json({ error: 'The target identifier (userId) is required' })
    }

    // prevent self-following
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself twin </3' })
    }

    const result = await followUser(followerId, followingId)

    if (!result) {
      return res.status(404).json({ error: 'User not found' })
    }

    const message = result.status === 'PENDING' ? 'Follow request sent' : 'User followed successfully'

    res.status(201).json({ message, status: result.status })
  } catch (error) {
    if (error.message === 'Already requesting or following this user') {
      return res.status(409).json({ error: error.message })
    }
    next(error)
  }
}

export async function followRequestActionController(req, res, next) {
  try {
    const userId = req.user.sub
    const requestId = req.params.requestId
    const action = req.validatedBody.action

    if (!requestId) {
      return res.status(400).json({ error: 'requestId route param is required' })
    }

    let result = null

    switch (action) {
      case 'accept':
        result = await userService.acceptFollowRequestById(userId, requestId)
        break
      case 'reject':
        result = await userService.rejectFollowRequestById(userId, requestId)
        break
      case 'cancel':
        result = await userService.deleteFollowByUserId(userId, requestId)
        break
    }

    if (!result) return res.status(404).json({ error: 'Follow request not found' })

    res.status(204).send()
  } catch (error) {
    if (error.message.startsWith('Forbidden')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message.startsWith('Cannot accept')) {
      return res.status(400).json({ error: error.message })
    }
    next(error)
  }
}
export async function deleteFollowController(req, res, next) {
  try {
    const followerId = req.user.sub
    const followId = req.params.followId || req.params.requestId

    const result = await userService.deleteFollowByUserId(followerId, followId)

    if (!result) {
      return res.status(404).json({ error: 'Follow relationship not found' })
    }

    res.status(204).send()
  } catch (error) {
    if (error.message.includes('Forbiddern')) {
      return res.status(403).json({ error: error.message })
    }
    next(error)
  }
}

// export async function rejectFollowRequestController(req, res, next) {
//   try {
//     const userId = req.user.sub
//     const followId = req.params.id

//     const result = await rejectFollowRequestById(userId, followId)
//     if (!result) return res.status(404).json({ error: 'Follow request not found' })

//     res.status(204).send()
//   } catch (error) {
//     if (error.message.startsWith('Forbidden')) {
//       return res.status(403).json({ error: error.message })
//     }
//     if (error.message.startsWith('Cannot reject')) {
//       return res.status(400).json({ error: error.message })
//     }
//     next(error)
//   }
// }

// export async function cancelFollowRequestController(req, res, next) {
//   try {
//     const followerId = req.user.sub
//     const followingId = req.params.id

//     const result = await cancelFollowRequest(followerId, followingId)

//     if (!result) {
//       return res.status(404).json({ error: 'Follow request not found' })
//     }

//     res.status(204).send() // no content - request (follow record) was deleted
//   } catch (error) {
//     next(error)
//   }
// }

export async function getFollowersController(req, res, next) {
  try {
    const targetUserId = req.params.userId
    const requesterId = req.user?.sub || null
    const { cursor, limit = 20 } = req.query

    const result = await userService.getFollowers(targetUserId, requesterId, cursor, parseInt(limit))
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getFollowingController(req, res, next) {
  try {
    const targetUserId = req.params.userId
    const requesterId = req.user?.sub || null
    const { cursor, limit = 20 } = req.query

    const following = await getFollowing(targetUserId, requesterId, cursor, parseInt(limit))
    res.json(following)
  } catch (error) {
    next(error)
  }
}

export async function uploadAvatarController(req, res, next) {
  try {
    const userId = req.user.sub
    const file = req.file // Already-validated file from the multer middleware

    const result = await uploadUserAvatar(userId, file.buffer, file.mimetype)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

// Get pending follow requests for the authenticated user
export async function getFollowRequestsController(req, res, next) {
  try {
    const userId = req.user.sub
    const { cursor, limit = 10 } = req.query

    const result = await getPendingFollowRequests(userId, cursor, parseInt(limit))

    res.json(result)
  } catch (error) {
    next(error)
  }
}
