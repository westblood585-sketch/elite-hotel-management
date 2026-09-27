import { z } from 'zod'

// Signup schema
export const signUpSchema = z.object({
  fullName: z
    .string({ message: 'Full Name must be a string' })
    .min(1, { message: 'Full Name is required' })
    .min(2, { message: 'Full Name should have at least 2 characters' })
    .max(50, { message: 'Full Name should have at most 50 characters' })
    .trim(),

  email: z
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/, {
      message: 'Email must have a .com domain',
    }),

  password: z
    .string({ message: 'Password must be a string' })
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password should have at least 8 characters' })
    .max(50, { message: 'Password should have at most 50 characters' })
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^a-zA-Z0-9]/,
      'Password must contain at least one special character'
    ),

  phoneNumber: z
    .string()
    .length(10, 'Phone number must be exactly 10 digits')
    .min(1, { message: 'Phone number is required' })
    .regex(/^\d+$/, 'Phone number must contain only digits'),
})

// Sign in schema
export const signInSchema = z.object({
  email: z
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' })
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/, {
      message: 'Email must have a .com domain',
    }),
  password: z
    .string({ message: 'Password must be a string' })
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password should have at least 8 characters' })
    .max(50, { message: 'Password should have at most 50 characters' })
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^a-zA-Z0-9]/,
      'Password must contain at least one special character'
    ),
})

// Reset Password Schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string({ message: 'Password must be a string' })
      .min(1, { message: 'Password is required' })
      .min(8, { message: 'Password should have at least 8 characters' })
      .max(50, { message: 'Password should have at most 50 characters' })
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z
      .string({ message: 'Confirm Password must be a string' })
      .min(1, { message: 'Confirm Password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

// Type inference for TypeScript
export type SignUpSchemaType = z.infer<typeof signUpSchema>
export type signInSchemaType = z.infer<typeof signInSchema>
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>
