import express from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '#middlewares/auth.middleware.js';
import {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from '#controllers/users.controller.js';
import { adminProtection } from '#config/arcjet.js';
import logger from '#config/logger.js';

const router = express.Router();

const adminArcjetMiddleware = async (req, res, next) => {
  const decision = await adminProtection.protect(req, { requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`);
      return res
        .status(429)
        .json({ error: 'Too many admin requests. Please try again later.' });
    }
    logger.warn(`Admin request denied for IP: ${req.ip}`);
    return res.status(403).json({ error: 'Admin request denied' });
  }

  next();
};

router.get(
  '/',
  authenticateToken,
  requireAdmin,
  adminArcjetMiddleware,
  getAllUsers
);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  adminArcjetMiddleware,
  deleteUser
);

export default router;
