import { UsersService } from '#services/users.service.js';
import { updateUserSchema, userIdSchema } from '#validations/users.validation.js';
import logger from '#config/logger.js';

export class UsersController {
  static async getAllUsers(req, res, next) {
    try {
      logger.info('Fetching all users');
      
      const allUsers = await UsersService.getAllUsers();

      res.json({
        message: 'Users retrieved successfully',
        users: allUsers,
        count: allUsers.length,
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const { error: paramError, value: paramValue } = userIdSchema.validate({ id: parseInt(req.params.id, 10) });
      
      if (paramError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: paramError.details.map(detail => detail.message),
        });
      }

      const { id: userId } = paramValue;

      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const user = await UsersService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info(`User retrieved: ${user.email}`);
      res.json({
        message: 'User retrieved successfully',
        user,
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { error: paramError, value: paramValue } = userIdSchema.validate({ id: parseInt(req.params.id, 10) });
      
      if (paramError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: paramError.details.map(detail => detail.message),
        });
      }

      const { id: userId } = paramValue;

      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { error: bodyError, value: bodyValue } = updateUserSchema.validate(req.body);
      
      if (bodyError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: bodyError.details.map(detail => detail.message),
        });
      }

      if (bodyValue.role && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change user roles' });
      }

      const updatedUser = await UsersService.updateUser(userId, bodyValue);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info(`User updated: ${updatedUser.email}`);
      res.json({
        message: 'User updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      
      if (error.message && error.message.includes('unique')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { error: paramError, value: paramValue } = userIdSchema.validate({ id: parseInt(req.params.id, 10) });
      
      if (paramError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: paramError.details.map(detail => detail.message),
        });
      }

      const { id: userId } = paramValue;

      if (req.user.id === userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const deletedUser = await UsersService.deleteUser(userId);

      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info(`User deleted: ${deletedUser.email}`);
      res.json({
        message: 'User deleted successfully',
        deletedUser: {
          id: deletedUser.id,
          email: deletedUser.email,
        },
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      next(error);
    }
  }
}
