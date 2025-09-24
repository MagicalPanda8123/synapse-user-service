import Joi from 'joi'

/**
 * Joi schema for validating user profile update requests.
 *
 * Fields:
 * - username: Required string for username updates. Optional.
 * - firstName: Required string for first name. Optional.
 * - lastName: Required string for last name. Optional.
 * - gender: Must be either "MALE" or "FEMALE". Optional.
 * - bio: Optional string for user biography.
 * - location: Optional string for user location.
 * - avatarUrl: Optional valid URL for user avatar.
 *
 * Note: isPrivate is excluded - use dedicated privacy toggle endpoint.
 * The request body must include at least one field.
 */
export const userProfileUpdateSchema = Joi.object({
  // Username: required string if provided
  username: Joi.string().min(1).max(50),

  // First name: required string if provided
  firstName: Joi.string().min(1).max(50),

  // Last name: required string if provided
  lastName: Joi.string().min(1).max(50),

  // Gender: must be MALE or FEMALE (matching Prisma enum)
  gender: Joi.string().valid('MALE', 'FEMALE'),

  // Bio: optional string, can be empty
  bio: Joi.string().max(255).allow(''),

  // Location: optional string, can be empty
  location: Joi.string().max(100).allow(''),

  // Note: isPrivate is intentionally excluded - use separate privacy endpoint
})
  .min(1)
  .unknown(false) // Require at least one field in the request body
