import express from 'express';
import {
  getAllUsers,
  getUserByIdController as getUserById,
  updateUserController as updateUser,
  deleteUserController as deleteUser,
} from '#controllers/users.controller.js';
import {
  authenticateToken,
  requireAdmin,
} from '#middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
