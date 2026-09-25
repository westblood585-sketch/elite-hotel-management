import Joi from 'joi'

export const completeTaskSchema = Joi.object({
  notes: Joi.string().max(2000).optional(),
})
