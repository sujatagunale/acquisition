import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';
import logger from '#config/logger.js';
import * as usersService from '#services/users.service.js';
import { formatValidationError } from '#utils/format.js';

export const getAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching all users');

    const allUsers = await usersService.getAllUsers();

    res.json({
      message: 'Users retrieved successfully',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse({
      id: parseInt(req.params.id, 10),
    });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid user ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid user ID',
      });
    }

    const { id: userId } = paramValidation.data;

    const user = await usersService.getUserById(userId);

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
};

export const updateUser = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse({
      id: parseInt(req.params.id, 10),
    });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid user ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid user ID',
      });
    }

    const { id: userId } = paramValidation.data;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'No valid updates provided',
        details:
          formatValidationError(bodyValidation.error) ||
          'No valid updates provided',
      });
    }

    if (bodyValidation.data.role && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only admins can change user roles' });
    }

    const updatedUser = await usersService.updateUser(
      userId,
      bodyValidation.data
    );

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
};

export const deleteUser = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse({
      id: parseInt(req.params.id, 10),
    });

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Invalid user ID',
        details:
          formatValidationError(paramValidation.error) || 'Invalid user ID',
      });
    }

    const { id: userId } = paramValidation.data;

    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const deletedUser = await usersService.deleteUser(userId);

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
};
