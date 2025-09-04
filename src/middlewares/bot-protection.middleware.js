import { detectBot } from '@arcjet/node';
import aj from '#config/arcjet.js';
import logger from '#config/logger.js';

const botProtectionMiddleware = async (req, res, next) => {
  try {
    const client = aj.withRule(
      detectBot({
        mode: 'LIVE',
        allow: [
          'CATEGORY:SEARCH_ENGINE',
          'CATEGORY:PREVIEW',
          'CATEGORY:MONITOR',
        ],
        deny: [
          'CATEGORY:AI',
          'CATEGORY:SCRAPER',
          'CATEGORY:AUTOMATED',
        ],
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }

    next();
  } catch (error) {
    logger.error('Bot protection middleware error:', error);
    next();
  }
};

export default botProtectionMiddleware;
