import arcjet, {
  detectBot,
  tokenBucket,
  shield,
  slidingWindow,
  validateEmail,
} from '@arcjet/node';
import logger from '#config/logger.js';

const aj = process.env.NODE_ENV === 'test' 
  ? null 
  : arcjet({
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

export const authProtection = process.env.NODE_ENV === 'test'
  ? null
  : arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ['ip.src'],
    rules: [
      shield({ mode: 'LIVE' }),
      detectBot({
        mode: 'LIVE',
        allow: ['CATEGORY:SEARCH_ENGINE'],
      }),
      slidingWindow({
        mode: 'LIVE',
        interval: '10m',
        max: 5,
      }),
      validateEmail({
        mode: 'LIVE',
        block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS', 'FREE'],
      }),
    ],
  });

export const dealProtection = process.env.NODE_ENV === 'test'
  ? null
  : arcjet({
    key: process.env.ARCJET_KEY,
    characteristics: ['ip.src', 'userId'],
    rules: [
      shield({ mode: 'LIVE' }),
      detectBot({
        mode: 'LIVE',
        allow: [],
      }),
      slidingWindow({
        mode: 'LIVE',
        interval: '1h',
        max: 20,
      }),
    ],
  });

export const advancedProtection = (options = {}) => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || !aj) {
      return next();
    }

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

        if (options.allowedCountries && decision.ip.hasCountry && decision.ip.hasCountry()) {
          if (!options.allowedCountries.includes(decision.ip.country)) {
            logger.warn('Country not allowed', {
              ip: req.ip,
              country: decision.ip.country,
              allowed: options.allowedCountries,
            });
            return res.status(403).json({
              error: 'Geographic restriction',
              message: 'Access not available in your region',
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
};

export const adaptiveRateLimit = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

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

  const rateLimitRule = aj?.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: limits[userRole],
      interval: 60,
      capacity: limits[userRole],
      characteristics,
    })
  );

  if (!rateLimitRule) {
    return next();
  }

  return advancedProtection()(req, res, next);
};

export const basicProtection = advancedProtection();

export const financialProtection = advancedProtection({
  allowedCountries: ['US', 'CA', 'GB', 'AU'],
});

export const authBotProtection = authProtection;
export const apiRateLimit = aj;
export const sensitiveDataShield = aj;
export const handleArcjetResponse = (_instance) => advancedProtection();
