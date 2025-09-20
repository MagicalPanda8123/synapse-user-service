import Joi from 'joi'

export const userPreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark'),
  language: Joi.string().min(2).max(5),
  extras: Joi.object({
    notifications: Joi.boolean().required(),
  }).unknown(false),
}).min(1)
