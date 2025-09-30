import { Router } from 'express'
import * as userController from '../controllers/user.controller.js'
import { internalAuthMiddleware, authMiddleware, validate, optionalAuthMiddleware } from '../middleware/index.js'
import { userPreferencesSchema, userProfileUpdateSchema } from '../validations/index.js'
import { avatarUpload } from '../middleware/upload.middleware.js'
import { followRequestActionSchema } from '../validations/follow-request-action.schema.js'

const router = Router()

// search users (THE DECLARATION ORDER MATTERS, this one comes before /:id)
router.get('/search', userController.searchUsersController)

// get follow requests
router.get('/me/follow-requests', authMiddleware, userController.getPendingFollowRequestsController)

// interact with a request (accept, reject, cancel)
router.patch('/me/follow-requests/:requestId', authMiddleware, validate(followRequestActionSchema), userController.followRequestActionController)

// reject a follow request
// router.patch('/me/follow-requests/:id/reject', authMiddleware, userController.rejectFollowRequestController)

// Internal route for creating a user (accessible only by trusted services)
router.post('/', internalAuthMiddleware, userController.registerUserController)

// get a user profile
router.get('/:userId', optionalAuthMiddleware, userController.getUserProfileController)

// update user profile
router.patch('/me', authMiddleware, validate(userProfileUpdateSchema), userController.updateUserProfileController)
router.patch('/me/privacy', authMiddleware, userController.toggleUserPrivacyController)

// get user preferences
router.get('/me/preferences', authMiddleware, userController.getUserPreferencesController)

// update user preferences
router.patch('/me/preferences', authMiddleware, validate(userPreferencesSchema), userController.updateUserPreferencesController)

// update user avatar
router.patch('/me/avatar', authMiddleware, avatarUpload, userController.uploadAvatarController)

// follow another user
router.post('/me/following', authMiddleware, userController.followUserController)

// unfollow another user
router.delete('/me/following/:userId', authMiddleware, userController.unfollowController)

// get lists of followers and following-s
router.get('/:userId/followers', authMiddleware, userController.getFollowersController)
router.get('/:userId/following', authMiddleware, userController.getFollowingController)

// router.delete('/:id/follow/cancel', authMiddleware, userController.cancelFollowRequestController)
export default router
