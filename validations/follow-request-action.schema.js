import Joi from 'joi'

export const followRequestActionSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject', 'cancel').required().messages({
    'any.required': 'Action is required',
    'any.only': 'Action must be one of: accept, reject, cancel',
  }),
})
