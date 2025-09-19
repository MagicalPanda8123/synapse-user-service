import { Router } from 'express'
import {
  getUserPreferencesController,
  getUserProfileController,
  registerUserController,
  searchUsersController,
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

router.get('/:id', getUserProfileController)
router.patch('/:id', authMiddleware, updateUserProfileController)

// user preferences endpoints
router.get('/:id/preferences', authMiddleware, getUserPreferencesController)

router.patch(
  '/:id/preferences',
  authMiddleware,
  validate(userPreferencesSchema),
  updateUserPreferencesController
)

export default router
