import { Router } from 'express'
import { registerUserController } from '../controllers/index.js'
import { internalAuthMiddleware } from '../middleware/internal-auth.middleware.js'

const router = Router()

// Internal route for creating a user (accessible only by trusted services)
router.post('/', internalAuthMiddleware, registerUserController)

export default router
