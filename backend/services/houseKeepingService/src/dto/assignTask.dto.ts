import Joi from 'joi'

export const assignTaskSchema = Joi.object({
  roomId: Joi.string().required(),
  reservationId: Joi.string().optional(),
  assignedTo: Joi.string().optional().allow('').allow(null), // staff id
  taskType: Joi.string().valid('cleaning', 'maintenance', 'inspection', 'turndown').optional().default('cleaning'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional().default('normal'),
  estimatedDuration: Joi.number().optional(),
  notes: Joi.string().max(2000).optional().allow(''),
})
