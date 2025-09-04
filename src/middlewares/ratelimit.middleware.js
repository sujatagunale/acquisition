import { slidingWindow } from '@arcjet/node';
import aj from '#config/arcjet.js';

const ratelimitMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin request limit exceeded (20 per minute). Slow down!';
        break;
      case 'user':
        limit = 10;
        message = 'User request limit exceeded (10 per minute). Please wait.';
        break;
      default:
        limit = 5;
        message =
          'Guest request limit exceeded (5 per minute). Please sign up for higher limits.';
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
      });
    }

    next();
  } catch (error) {
    console.error('Arcjet middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong with the rate limiter.',
    });
  }
};

export default ratelimitMiddleware;
