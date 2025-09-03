import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import { authProtection } from '#config/arcjet.js';
import logger from '#config/logger.js';

const router = express.Router();

const authMiddleware = async (req, res, next) => {
  const decision = await authProtection.protect(req, { requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      return res
        .status(429)
        .json({
          error: 'Too many authentication attempts. Please try again later.',
        });
    }
    logger.warn(`Auth request denied for IP: ${req.ip}`);
    return res.status(403).json({ error: 'Authentication request denied' });
  }

  next();
};

router.post('/signup', authMiddleware, signup);
router.post('/signin', authMiddleware, signin);
router.post('/signout', signout); // No extra protection needed for signout

export default router;
