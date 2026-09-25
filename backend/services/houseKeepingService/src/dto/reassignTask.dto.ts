import Joi from 'joi'

export const reassignTaskSchema = Joi.object({
  assignedTo: Joi.string().required(),
  notes: Joi.string().max(2000).optional(),
})
