import Joi from 'joi';

export const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 255 characters',
    }),
  
  email: Joi.string()
    .email()
    .max(255)
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Valid email is required',
      'string.max': 'Email must not exceed 255 characters',
    }),
  
  role: Joi.string()
    .valid('user', 'admin')
    .messages({
      'any.only': 'Role must be either user or admin',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const userIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.positive': 'User ID must be positive',
      'any.required': 'User ID is required',
    }),
});
