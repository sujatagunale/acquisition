import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required',
    }),
  
  email: Joi.string()
    .email()
    .max(255)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Valid email is required',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
  
  role: Joi.string()
    .valid('user', 'admin')
    .default('user')
    .messages({
      'any.only': 'Role must be either user or admin',
    }),
});

export const signinSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Valid email is required',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});
