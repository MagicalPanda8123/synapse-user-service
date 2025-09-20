import { Router } from 'express'
import {
  acceptFollowRequestController,
  cancelFollowRequestController,
  followUserController,
  getFollowersController,
  getFollowingController,
  getUserPreferencesController,
  getUserProfileController,
  registerUserController,
  rejectFollowRequestController,
  searchUsersController,
  toggleUserPrivacyController,
  unfollowController,
  updateUserPreferencesController,
  updateUserProfileController,
} from '../controllers/index.js'
import {
  internalAuthMiddleware,
  authMiddleware,
  validate,
} from '../middleware/index.js'
import {
  userPreferencesSchema,
  userProfileUpdateSchema,
} from '../validations/index.js'
import { rejectFollowRequest } from '../services/user.service.js'

const router = Router()

// search users (THE DECLARATION ORDER MATTERS, this one comes before /:id)
router.get('/search', searchUsersController)

// Internal route for creating a user (accessible only by trusted services)
router.post('/', internalAuthMiddleware, registerUserController)

// user profile
router.get('/:id', getUserProfileController)
router.patch(
  '/:id',
  authMiddleware,
  validate(userProfileUpdateSchema),
  updateUserProfileController
)
router.patch('/:id/privacy', authMiddleware, toggleUserPrivacyController)

// user preferences endpoints
router.get('/:id/preferences', authMiddleware, getUserPreferencesController)

router.patch(
  '/:id/preferences',
  authMiddleware,
  validate(userPreferencesSchema),
  updateUserPreferencesController
)

// Social
router.post('/:id/follow', authMiddleware, followUserController)

router.patch(
  '/:id/follow/accept',
  authMiddleware,
  acceptFollowRequestController
)
router.patch(
  '/:id/follow/reject',
  authMiddleware,
  rejectFollowRequestController
)
router.delete(
  '/:id/follow/cancel',
  authMiddleware,
  cancelFollowRequestController
)
router.delete('/:id/follow', authMiddleware, unfollowController)

router.get('/:id/followers', authMiddleware, getFollowersController)

router.get('/:id/following', authMiddleware, getFollowingController)
export default router
