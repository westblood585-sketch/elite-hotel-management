import Joi from 'joi'

const signUpSchema = Joi.object({
  fullName: Joi.string()
    .required()
    .min(2)
    .max(50)
    .trim()
    .when('type', {
      is: 'signup',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.base': 'Full Name must be a string',
      'string.empty': 'Full Name is required',
      'string.min': 'Full Name should have at least 2 characters',
      'string.max': 'Full Name should have at most 50 characters',
      'any.required': 'Full Name is required',
    }),

  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/)
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'string.pattern.base': 'Email must have a .com domain',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .required()
    .min(8)
    .max(50)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^a-zA-Z0-9]/)
    .when('type', {
      is: 'signup',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password should have at least 8 characters',
      'string.max': 'Password should have at most 50 characters',
      'any.required': 'Password is required',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    }),

  phoneNumber: Joi.string()
    .length(10)
    .required()
    .pattern(/^\d+$/)
    .when('type', {
      is: 'signup',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.empty': 'Phone number is required',
      'string.length': 'Phone number must be exactly 10 digits',
      'string.pattern.base': 'Phone number must contain only digits',
      'any.required': 'Phone number is required',
    }),

  role: Joi.string()
    .valid('receptionist', 'housekeeper')
    .when('type', {
      is: 'signup',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.only': 'Role must be one of [receptionist, housekeeper]',
      'any.required': 'Role is a required field',
    }),

  avatar: Joi.object({
    publicId: Joi.string().required(),
    url: Joi.string().required(),
  }).optional(),
})

const signInSchema = Joi.object({
  email: Joi.string()
    .required()
    .email({ tlds: { allow: false } })
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/)
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'string.pattern.base': 'Email must have a .com domain',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .required()
    .min(8)
    .max(50)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^a-zA-Z0-9]/)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password should have at least 8 characters',
      'string.max': 'Password should have at most 50 characters',
      'any.required': 'Password is required',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    }),

  role: Joi.string()
    .valid('receptionist', 'housekeeper', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be one of [receptionist, housekeeper, admin]',
      'any.required': 'Role is a required field',
    }),
})

export { signUpSchema, signInSchema }
