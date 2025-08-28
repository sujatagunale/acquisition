import { db } from '#config/database.js';
import { users } from '#models/users.model.js';
import { eq } from 'drizzle-orm';
import logger from '#config/logger.js';

export class UsersService {
  static async getAllUsers() {
    try {
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      }).from(users);

      return allUsers;
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw error;
    }
  }

  static async getUserById(id) {
    try {
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      }).from(users).where(eq(users.id, id)).limit(1);

      return user || null;
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  static async updateUser(id, updates) {
    try {
      const updateData = { ...updates, updated_at: new Date() };
      
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          created_at: users.created_at,
          updated_at: users.updated_at,
        });

      return updatedUser || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
        });

      return deletedUser || null;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }
}
