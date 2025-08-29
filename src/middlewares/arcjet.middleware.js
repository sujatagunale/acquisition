import arcjet, {
  detectBot,
  tokenBucket,
  shield,
  slidingWindow,
  validateEmail,
} from '@arcjet/node';
import logger from '#config/logger.js';

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip.src'],
  rules: [
    shield({
      mode: 'LIVE',
    }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    }),
    tokenBucket({
      mode: 'LIVE',
      refillRate: 60,
      interval: 60,
      capacity: 60,
    }),
  ],
});

export const baseProtection = async (req, res, next) => {
  try {
    const characteristics = ['ip.src'];
    if (req.user?.id) {
      characteristics.push(`userId.${req.user.id}`);
    }
    if (req.user?.role) {
      characteristics.push(`userRole.${req.user.role}`);
    }

    const decision = await aj.protect(req, {
      characteristics,
      email: req.body?.email,
    });

    if (decision.ip) {
      if (decision.ip.hasASN && decision.ip.hasASN() && decision.ip.asnType === 'hosting') {
        logger.warn('Hosting provider detected', {
          ip: req.ip,
          asn: decision.ip.asn,
          asnType: decision.ip.asnType,
        });
        return res.status(403).json({
          error: 'Request blocked',
          message: 'Requests from hosting providers are not allowed',
        });
      }

      if (decision.ip.isVpn && decision.ip.isVpn() || 
          decision.ip.isProxy && decision.ip.isProxy() || 
          decision.ip.isRelay && decision.ip.isRelay()) {
        if (decision.ip.hasService && decision.ip.hasService() && decision.ip.service === 'Apple Private Relay') {
          logger.info('Apple Private Relay detected - allowing', { ip: req.ip });
        } else {
          logger.warn('VPN/Proxy detected', {
            ip: req.ip,
            service: decision.ip.service,
            isVpn: decision.ip.isVpn && decision.ip.isVpn(),
            isProxy: decision.ip.isProxy && decision.ip.isProxy(),
          });
          return res.status(403).json({
            error: 'VPN/Proxy detected',
            message: 'Requests from VPNs and proxies are not allowed',
          });
        }
      }
    }

    if (decision.isDenied()) {
      logger.warn('Arcjet blocked request:', {
        reason: decision.reason,
        ip: req.ip,
        url: req.url,
        method: req.method,
        decisionId: decision.id,
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

      return res.status(403).json({
        error: 'Request blocked',
        message: 'Request was blocked by security policy',
      });
    }

    req.arcjet = {
      decision,
      ip: decision.ip,
    };

    next();
  } catch (error) {
    logger.error('Arcjet middleware error:', error);
    next();
  }
};

export const authProtection = async (req, res, next) => {
  const authInstance = aj.withRule(
    slidingWindow({
      mode: 'LIVE',
      interval: '10m',
      max: 5,
    })
  );

  try {
    const decision = await authInstance.protect(req);

    if (decision.isDenied()) {
      logger.warn('Auth protection blocked request:', {
        reason: decision.reason,
        ip: req.ip,
        url: req.url,
        method: req.method,
        decisionId: decision.id,
      });

      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many authentication attempts, please try again later',
        });
      }

      return res.status(403).json({
        error: 'Request blocked',
        message: 'Authentication request was blocked by security policy',
      });
    }

    next();
  } catch (error) {
    logger.error('Auth protection error:', error);
    next();
  }
};

export const emailValidation = async (req, res, next) => {
  const emailInstance = aj.withRule(
    validateEmail({
      mode: 'LIVE',
      block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS', 'FREE'],
    })
  );

  try {
    const decision = await emailInstance.protect(req, {
      email: req.body?.email,
    });

    if (decision.isDenied() && decision.reason.isEmail()) {
      logger.warn('Email validation failed:', {
        email: req.body?.email,
        ip: req.ip,
        decisionId: decision.id,
      });
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Email address is invalid or not allowed',
      });
    }

    next();
  } catch (error) {
    logger.error('Email validation error:', error);
    next();
  }
};

export const adaptiveRateLimit = async (req, res, next) => {
  const userRole = req.user?.role || 'anonymous';
  const userId = req.user?.id;

  const limits = {
    admin: 200,
    user: 60,
    anonymous: 20,
  };

  const characteristics = ['ip.src', `user.role.${userRole}`];
  if (userId) {
    characteristics.push(`userId.${userId}`);
  }

  const rateLimitRule = aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: limits[userRole],
      interval: 60,
      capacity: limits[userRole],
      characteristics,
    })
  );

  try {
    const decision = await rateLimitRule.protect(req);

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded:', {
        userRole,
        userId,
        ip: req.ip,
        url: req.url,
      });
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
      });
    }

    next();
  } catch (error) {
    logger.error('Adaptive rate limit error:', error);
    next();
  }
};

export const financialProtection = async (req, res, next) => {
  const dealInstance = aj.withRule(
    slidingWindow({
      mode: 'LIVE',
      interval: '1h',
      max: 20,
      characteristics: ['ip.src', 'userId'],
    }),
    detectBot({
      mode: 'LIVE',
      allow: [],
    })
  );

  try {
    const decision = await dealInstance.protect(req);

    if (decision.ip && decision.ip.hasCountry && decision.ip.hasCountry()) {
      const allowedCountries = ['US', 'CA', 'GB', 'AU'];
      if (!allowedCountries.includes(decision.ip.country)) {
        logger.warn('Financial operation blocked by geography', {
          ip: req.ip,
          country: decision.ip.country,
          allowed: allowedCountries,
        });
        return res.status(403).json({
          error: 'Geographic restriction',
          message: 'Financial operations not available in your region',
        });
      }
    }

    if (decision.isDenied()) {
      logger.warn('Financial operation blocked:', {
        reason: decision.reason,
        ip: req.ip,
        url: req.url,
        method: req.method,
        decisionId: decision.id,
      });

      if (decision.reason.isBot()) {
        return res.status(403).json({
          error: 'Bot detected',
          message: 'Automated requests are not allowed for financial operations',
        });
      }

      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many financial operations, please try again later',
        });
      }

      return res.status(403).json({
        error: 'Financial operation blocked',
        message: 'Request was blocked by financial security policy',
      });
    }

    req.arcjet = {
      decision,
      ip: decision.ip,
    };

    next();
  } catch (error) {
    logger.error('Financial protection error:', error);
    next();
  }
};

export const authBotProtection = authProtection;
export const apiRateLimit = aj;
export const sensitiveDataShield = baseProtection;
export const basicProtection = baseProtection;
export const handleArcjetResponse = () => baseProtection;
