import aj from '#config/arcjet.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import logger from '#config/logger.js';

export const signupValidationMiddleware = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Signup validation failed', {
        ip: req.ip,
        errors: validationResult.error.errors,
        path: req.path,
      });
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid signup data',
        details: validationResult.error.errors,
      });
    }

    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      logger.warn('Arcjet protection triggered for signup', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason,
      });
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
      });
    }

    next();
  } catch (error) {
    logger.error('Signup validation middleware error:', error);
    next();
  }
};

export const signinValidationMiddleware = async (req, res, next) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Signin validation failed', {
        ip: req.ip,
        errors: validationResult.error.errors,
        path: req.path,
      });
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid signin data',
        details: validationResult.error.errors,
      });
    }

    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      logger.warn('Arcjet protection triggered for signin', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason,
      });
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
      });
    }

    next();
  } catch (error) {
    logger.error('Signin validation middleware error:', error);
    next();
  }
};
