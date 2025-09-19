import { Router } from 'express'
import {
  getUserProfileController,
  registerUserController,
  updateUserProfileController,
} from '../controllers/index.js'
import { internalAuthMiddleware, authMiddleware } from '../middleware/index.js'

const router = Router()

// Internal route for creating a user (accessible only by trusted services)
router.post('/', internalAuthMiddleware, registerUserController)

router.get('/:id', getUserProfileController)
router.patch('/:id', authMiddleware, updateUserProfileController)

export default router
