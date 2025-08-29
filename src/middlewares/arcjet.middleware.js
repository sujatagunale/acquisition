import arcjet, { detectBot, tokenBucket, shield } from '@arcjet/node';
import logger from '#config/logger.js';

const aj =
  process.env.NODE_ENV === 'test'
    ? null
    : arcjet({
        key: process.env.ARCJET_KEY,
        characteristics: ['ip.src'],
      });

export const authBotProtection =
  aj?.withRule(
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    })
  ) || null;

export const apiRateLimit =
  aj?.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 60,
      interval: 60,
      capacity: 60,
    })
  ) || null;

export const adaptiveRateLimit = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const userRole = req.user?.role || 'anonymous';

  const limits = {
    admin: 200, // Higher limit for admins
    user: 60, // Standard limit for users
    anonymous: 20, // Lower limit for unauthenticated
  };

  const rateLimitRule =
    aj?.withRule(
      tokenBucket({
        mode: 'LIVE',
        refillRate: limits[userRole],
        interval: 60,
        capacity: limits[userRole],
        characteristics: ['ip.src', `user.role.${userRole}`],
      })
    ) || null;

  if (!rateLimitRule) {
    return next();
  }

  return handleArcjetResponse(rateLimitRule)(req, res, next);
};

export const sensitiveDataShield =
  aj?.withRule(
    shield({
      mode: 'LIVE',
    })
  ) || null;

export const handleArcjetResponse = arcjetInstance => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || !arcjetInstance) {
      return next();
    }

    try {
      const decision = await arcjetInstance(req);

      if (decision.isDenied()) {
        logger.warn('Arcjet blocked request:', {
          reason: decision.reason,
          ip: req.ip,
          url: req.url,
          method: req.method,
        });

        if (decision.reason.isBot()) {
          return res.status(403).json({
            error: 'Bot detected',
            message: 'Automated requests are not allowed',
          });
        }

        if (decision.reason.isRateLimit()) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests, please try again later',
          });
        }

        if (decision.reason.isShield()) {
          return res.status(400).json({
            error: 'Request blocked',
            message: 'Request contains suspicious content',
          });
        }

        if (decision.reason.isSensitiveInfo()) {
          return res.status(400).json({
            error: 'Sensitive information detected',
            message:
              'Request contains sensitive information that cannot be processed',
          });
        }

        if (decision.reason.isEmail()) {
          return res.status(400).json({
            error: 'Invalid email',
            message: 'Email address is invalid or not allowed',
          });
        }

        return res.status(403).json({
          error: 'Request blocked',
          message: 'Request was blocked by security policy',
        });
      }

      next();
    } catch (error) {
      logger.error('Arcjet middleware error:', error);
      next(); // Continue on Arcjet errors to avoid breaking the app
    }
  };
};
