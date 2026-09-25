// src/validators/reservation.schema.ts
import Joi from 'joi'

export const createReservationSchema = Joi.object({
  guestId: Joi.string().optional(),
  guest: Joi.object({
    fullName: Joi.string().min(2).required(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().optional(),
  }).when('guestId', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
  roomId: Joi.string().required(),
  checkIn: Joi.date().required(),
  checkOut: Joi.date().greater(Joi.ref('checkIn')).required(),
  totalAmount: Joi.number().positive().required(),
})

export const cancelReservationSchema = Joi.object({
  reason: Joi.string().optional(),
})
