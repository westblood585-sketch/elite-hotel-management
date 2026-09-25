// src/validators/user.validator.ts
import Joi from 'joi'

// Custom validator to prevent HTML/script tags in names
const noHtmlTags = (value: string, helpers: any) => {
  if (/<[^>]*>/g.test(value)) {
    return helpers.error('string.noHtml')
  }
  return value
}

export const updateUserSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .custom(noHtmlTags, 'No HTML tags validation')
    .required()
    .messages({
      'string.noHtml': 'Full name cannot contain HTML tags',
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 100 characters',
    }),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),
  role: Joi.string()
    .valid('admin', 'receptionist', 'housekeeper')
    .required()
    .messages({
      'any.only': 'Role must be one of: admin, receptionist, housekeeper',
    }),
  isApproved: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .optional()
    .messages({
      'any.only': 'Approval status must be: pending, approved, or rejected',
    }),
})

export const patchUserSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .custom(noHtmlTags, 'No HTML tags validation')
    .optional()
    .messages({
      'string.noHtml': 'Full name cannot contain HTML tags',
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 100 characters',
    }),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),
  role: Joi.string()
    .valid('admin', 'receptionist', 'housekeeper')
    .optional()
    .messages({
      'any.only': 'Role must be one of: admin, receptionist, housekeeper',
    }),
  isApproved: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .optional()
    .messages({
      'any.only': 'Approval status must be: pending, approved, or rejected',
    }),
}).min(1)
