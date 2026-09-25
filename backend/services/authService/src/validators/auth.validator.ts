import Joi from 'joi'

/**
 * OTP Verification Schema
 */
export const otpVerificationSchema = Joi.object({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  otp: Joi.string()
    .required()
    .length(6)
    .pattern(/^\d{6}$/)
    .messages({
      'string.empty': 'OTP is required',
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
  type: Joi.string()
    .optional()
    .valid('signup', 'forgetPassword')
    .messages({
      'any.only': 'Type must be either signup or forgetPassword',
    }),
})

/**
 * OTP Resend Schema
 */
export const otpResendSchema = Joi.object({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
})

/**
 * Forget Password Schema
 */
export const forgetPasswordSchema = Joi.object({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
})

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .min(8)
    .max(50)
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'digit')
    .pattern(/[^a-zA-Z0-9]/, 'special')
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be at most 50 characters',
      'string.pattern.name': 'Password must contain at least one {#name} character',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'string.empty': 'Confirm password is required',
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required',
    }),
  token: Joi.string().required().messages({
    'string.empty': 'Token is required',
    'any.required': 'Token is required',
  }),
})

/**
 * Change Password Schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .required()
    .min(8)
    .max(50)
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'digit')
    .pattern(/[^a-zA-Z0-9]/, 'special')
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be at most 50 characters',
      'string.pattern.name': 'Password must contain at least one {#name} character',
      'any.invalid': 'New password must be different from current password',
      'any.required': 'New password is required',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'string.empty': 'Confirm password is required',
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required',
    }),
})

/**
 * Google Sign-In Schema
 */
export const googleSignInSchema = Joi.object({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  name: Joi.string()
    .required()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 100 characters',
      'any.required': 'Name is required',
    }),
  phoneNumber: Joi.string()
    .optional()
    .pattern(/^[0-9]{10,15}$/)
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),
  role: Joi.string()
    .required()
    .valid('receptionist', 'housekeeper')
    .messages({
      'any.only': 'Role must be either receptionist or housekeeper',
      'any.required': 'Role is required',
    }),
})
