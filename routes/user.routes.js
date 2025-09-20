import { Router } from 'express'
import {
  getUserPreferencesController,
  getUserProfileController,
  registerUserController,
  searchUsersController,
  toggleUserPrivacyController,
  updateUserPreferencesController,
  updateUserProfileController,
} from '../controllers/index.js'
import {
  internalAuthMiddleware,
  authMiddleware,
  validate,
} from '../middleware/index.js'
import { userPreferencesSchema } from '../validations/index.js'

const router = Router()

// search users (THE DECLARATION ORDER MATTERS, this one comes before /:id)
router.get('/search', searchUsersController)

// Internal route for creating a user (accessible only by trusted services)
router.post('/', internalAuthMiddleware, registerUserController)

// user profile
router.get('/:id', getUserProfileController)
router.patch('/:id', authMiddleware, updateUserProfileController)
router.patch('/:id/privacy', authMiddleware, toggleUserPrivacyController)

// user preferences endpoints
router.get('/:id/preferences', authMiddleware, getUserPreferencesController)

router.patch(
  '/:id/preferences',
  authMiddleware,
  validate(userPreferencesSchema),
  updateUserPreferencesController
)

export default router
