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
import { rateLimitPerUser, sensitiveDetector } from '#config/arcjet.js';

const router = express.Router();

const userLimiter = rateLimitPerUser();
const sensitive = sensitiveDetector();

router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, userLimiter, sensitive, updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userLimiter, deleteUser);

export default router;
