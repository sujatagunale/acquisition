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
import { 
  adaptiveRateLimit,
  basicProtection,
} from '#middlewares/arcjet.middleware.js';

const router = express.Router();

router.use(basicProtection);
router.use(adaptiveRateLimit);

router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
