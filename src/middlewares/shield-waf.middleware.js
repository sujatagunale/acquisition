import { shield } from '@arcjet/node';
import aj from '#config/arcjet.js';
import logger from '#config/logger.js';

const shieldWafMiddleware = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const client = aj.withRule(
      shield({
        mode: 'LIVE',
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield WAF blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
    }

    next();
  } catch (error) {
    logger.error('Shield WAF middleware error:', error);
    next();
  }
};

export default shieldWafMiddleware;
