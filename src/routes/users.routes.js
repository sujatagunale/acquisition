import express from 'express';
import { UsersController } from '#controllers/users.controller.js';
import { authenticateToken, requireAdmin } from '#middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, UsersController.getAllUsers);
router.get('/:id', authenticateToken, UsersController.getUserById);
router.put('/:id', authenticateToken, UsersController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, UsersController.deleteUser);

export default router;
