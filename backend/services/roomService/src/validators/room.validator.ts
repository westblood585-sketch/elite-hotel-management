import Joi from 'joi'

export const createRoomSchema = Joi.object({
  number: Joi.alternatives(Joi.number(), Joi.string()).required(),
  name: Joi.string().trim().min(2).max(100).required(),
  type: Joi.string()
    .valid('Standard', 'Deluxe', 'Premium', 'Luxury')
    .required(),
  price: Joi.alternatives(Joi.number(), Joi.string()).required(),
  description: Joi.string().max(2000).optional(),
  amenities: Joi.alternatives(
    Joi.array().items(Joi.string().trim()),
    Joi.string() // JSON array or comma-separated
  ).optional(),
  size: Joi.alternatives(Joi.number(), Joi.string()).required(),
  capacity: Joi.alternatives(Joi.number(), Joi.string()).required(),
  category: Joi.string()
    .valid('Single', 'Double', 'Suite', 'Family')
    .optional(),
  rating: Joi.alternatives(Joi.number(), Joi.string()).optional(),
  available: Joi.alternatives(Joi.boolean(), Joi.string()).optional(),
})

export const updateRoomSchema = createRoomSchema

export const patchRoomSchema = Joi.object({
  number: Joi.alternatives(Joi.number(), Joi.string()),
  name: Joi.string().trim().min(2).max(100),
  type: Joi.string().valid('Standard', 'Deluxe', 'Premium', 'Luxury'),
  price: Joi.alternatives(Joi.number(), Joi.string()),
  description: Joi.string().max(2000),
  amenities: Joi.alternatives(
    Joi.array().items(Joi.string().trim()),
    Joi.string()
  ),
  size: Joi.alternatives(Joi.number(), Joi.string()),
  capacity: Joi.alternatives(Joi.number(), Joi.string()),
  category: Joi.string().valid('Single', 'Double', 'Suite', 'Family'),
  rating: Joi.alternatives(Joi.number(), Joi.string()),
  available: Joi.alternatives(Joi.boolean(), Joi.string()),
}).min(1)
