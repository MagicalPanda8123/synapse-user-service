import { Router } from 'express'
import * as userController from '../controllers/user.controller.js'
import { internalAuthMiddleware, authMiddleware, validate, optionalAuthMiddleware } from '../middleware/index.js'
import { userPreferencesSchema, userProfileUpdateSchema } from '../validations/index.js'
import { avatarUpload } from '../middleware/upload.middleware.js'
import { followRequestActionSchema } from '../validations/follow-request-action.schema.js'

const router = Router()

// search users (THE DECLARATION ORDER MATTERS, this one comes before /:id)
router.get('/', userController.getUsersController)

/**
 *
 * FOLLOW REQUESTS AND RELATIONSHIPS
 *
 */

// get follow requests
router.get('/me/follow-requests', authMiddleware, userController.getFollowRequestsController)

// follow another user
router.post('/me/following', authMiddleware, userController.followUserController)

// accept, reject or cancel a follow request
router.patch('/me/follow-requests/:requestId', authMiddleware, validate(followRequestActionSchema), userController.followRequestActionController)

// unfollow a user
router.delete('/me/following/:followId', authMiddleware, userController.deleteFollowController)

/**
 *
 * USER PROFILE & PREFERENCES MANAGEMENT
 *
 */
// get user simple profile
router.get('/simple-profiles', userController.getSimpleProfilesController)

// get a user profile
router.get('/:userId', authMiddleware, userController.getUserProfileController)

// update user profile
router.patch('/me', authMiddleware, validate(userProfileUpdateSchema), userController.updateUserProfileController)

// toggle profile privacy
router.patch('/me/privacy', authMiddleware, userController.toggleUserPrivacyController)

// get user preferences
router.get('/me/preferences', authMiddleware, userController.getUserPreferencesController)

// update user preferences
router.patch('/me/preferences', authMiddleware, validate(userPreferencesSchema), userController.updateUserPreferencesController)

// update user avatar
router.patch('/me/avatar', authMiddleware, avatarUpload, userController.uploadAvatarController)

// get lists of followers and following-s
router.get('/:userId/followers', optionalAuthMiddleware, userController.getFollowersController)
router.get('/:userId/following', optionalAuthMiddleware, userController.getFollowingController)

/**
 *
 * INTERNAL ENDPOINTS
 *
 */

// Internal route for creating a user (accessible only by trusted services)
router.post('/', internalAuthMiddleware, userController.registerUserController)
// router.delete('/:id/follow/cancel', authMiddleware, userController.cancelFollowRequestController)

export default router
