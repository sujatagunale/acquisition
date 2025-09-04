import arcjet from '@arcjet/node';
import { validateBody } from '#utils/custom-rules.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import logger from '#config/logger.js';

const signupAj = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01k3t9534deq3rs2eb96fgsd2k',
  rules: [
    ...validateBody({
      mode: 'LIVE',
      schema: signupSchema,
    }),
  ],
});

const signinAj = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01k3t9534deq3rs2eb96fgsd2k',
  rules: [
    ...validateBody({
      mode: 'LIVE',
      schema: signinSchema,
    }),
  ],
});

export const signupValidationMiddleware = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const decision = await signupAj.protect(req);

    if (decision.isDenied()) {
      logger.warn('Signup validation failed via Arcjet custom rule', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason,
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid signup data',
        details: decision.reason.error || 'Validation error',
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
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const decision = await signinAj.protect(req);

    if (decision.isDenied()) {
      logger.warn('Signin validation failed via Arcjet custom rule', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason,
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid signin data',
        details: decision.reason.error || 'Validation error',
      });
    }

    next();
  } catch (error) {
    logger.error('Signin validation middleware error:', error);
    next();
  }
};
