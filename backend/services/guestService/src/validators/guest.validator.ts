// src/validators/guest.validator.ts
import Joi from 'joi'

// Regex patterns for security
const phonePattern = /^[0-9]{10,15}$/
const namePattern = /^[a-zA-Z\s\-']+$/ // Only letters, spaces, hyphens, apostrophes
const postalCodePattern = /^[A-Z0-9\s\-]{3,10}$/i

// Sanitize string to prevent XSS
const sanitizedString = (minLength: number = 1, maxLength: number = 100) =>
  Joi.string()
    .min(minLength)
    .max(maxLength)
    .trim()
    .regex(/^[^<>]*$/, 'no HTML tags') // Prevent HTML/script tags

const phone = Joi.string()
  .pattern(phonePattern)
  .message('Phone number must be 10-15 digits')

const address = Joi.object({
  line1: sanitizedString(0, 200).allow('', null),
  line2: sanitizedString(0, 200).allow('', null),
  city: sanitizedString(0, 100).allow('', null),
  state: sanitizedString(0, 100).allow('', null),
  postalCode: Joi.string()
    .pattern(postalCodePattern)
    .message('Invalid postal code format')
    .allow('', null),
  country: Joi.string()
    .length(2)
    .message('Country must be a 2-letter ISO code (e.g., US, IN)')
    .uppercase()
    .allow('', null),
})

const idProof = Joi.object({
  type: Joi.string()
    .valid('Passport', 'NationalID', 'DrivingLicense', 'Other')
    .optional(),
  number: sanitizedString(1, 50).optional(),
})

const preferences = Joi.object({
  smoking: Joi.alternatives(
    Joi.boolean(),
    Joi.string().valid('true', 'false', '1', '0')
  ),
  roomType: Joi.string().valid('Standard', 'Deluxe', 'Premium', 'Luxury'),
  bedType: Joi.string().valid('Single', 'Double', 'Queen', 'King'),
  notes: sanitizedString(0, 2000),
})

export const createGuestSchema = Joi.object({
  firstName: sanitizedString(2, 100)
    .pattern(namePattern)
    .message('First name can only contain letters, spaces, hyphens, and apostrophes')
    .required(),
  lastName: sanitizedString(1, 100)
    .pattern(namePattern)
    .message('Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  email: Joi.string()
    .email()
    .max(255)
    .lowercase()
    .trim()
    .optional(),
  phoneNumber: phone.required(),
  dateOfBirth: Joi.date().max('now').optional(),
  address: address.optional(),
  idProof: idProof.optional(),
  preferences: preferences.optional(),
  notes: sanitizedString(0, 5000).optional(),
  isBlacklisted: Joi.boolean().optional(),
  status: Joi.string().valid('Standard', 'VIP', 'Loyalty').optional(),
  isIdVerified: Joi.boolean().optional(),
  lastVisit: Joi.date().optional(),
})

export const updateGuestSchema = createGuestSchema // PUT expects full valid object

export const patchGuestSchema = Joi.object({
  firstName: sanitizedString(2, 100).pattern(namePattern),
  lastName: sanitizedString(1, 100).pattern(namePattern),
  email: Joi.string().email().max(255).lowercase().trim(),
  phoneNumber: phone,
  dateOfBirth: Joi.date().max('now'),
  address: address,
  idProof: idProof,
  preferences: preferences,
  notes: sanitizedString(0, 5000),
  isBlacklisted: Joi.boolean(),
  status: Joi.string().valid('Standard', 'VIP', 'Loyalty'),
  isIdVerified: Joi.boolean(),
  lastVisit: Joi.date(),
}).min(1)

export const ensureGuestSchema = Joi.object({
  firstName: sanitizedString(2, 100).pattern(namePattern).required(),
  lastName: sanitizedString(1, 100).pattern(namePattern).optional(),
  email: Joi.string().email().max(255).lowercase().trim().optional(),
  phoneNumber: phone.required(),
  idProof: idProof.optional(),
})
