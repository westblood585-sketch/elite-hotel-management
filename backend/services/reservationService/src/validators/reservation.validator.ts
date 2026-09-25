// src/validators/reservation.validator.ts
import Joi from 'joi'

const id = Joi.string().regex(/^[a-fA-F0-9]{24}$/)
const isoDate = Joi.date().iso()

export const quoteSchema = Joi.object({
  roomId: id.required(),
  checkIn: isoDate.required(),
  checkOut: isoDate.required(),
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
})

export const createReservationSchema = Joi.object({
  guestId: id.optional(),
  guestDetails: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().allow('').optional(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
  }).optional(),
  roomId: id.required(),
  checkIn: isoDate.required(),
  checkOut: isoDate.required(),
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).optional(),
  notes: Joi.string().max(5000).optional(),
  source: Joi.string().valid('Online', 'FrontDesk', 'OTA', 'Admin').optional(),
  requiresPrepayment: Joi.boolean().optional(),
  paymentProvider: Joi.string()
    .valid('Stripe', 'Razorpay', 'Offline')
    .when('requiresPrepayment', { is: true, then: Joi.required() }),
  currency: Joi.string().length(3).uppercase().optional(),
}).or('guestId', 'guestDetails')

export const listReservationSchema = Joi.object({
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(200),
  status: Joi.string().valid(
    'PendingPayment',
    'Confirmed',
    'Cancelled',
    'CheckedIn',
    'CheckedOut',
    'NoShow'
  ),
  guestId: id.optional(),
  roomId: id.optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  search: Joi.string().optional(),
})

export const patchReservationSchema = Joi.object({
  roomId: id.optional(),
  checkIn: isoDate.optional(),
  checkOut: isoDate.optional(),
  adults: Joi.number().integer().min(1).optional(),
  children: Joi.number().integer().min(0).optional(),
  notes: Joi.string().max(5000).optional(),
  status: Joi.forbidden(), // use specific endpoints for status changes
}).min(1)
