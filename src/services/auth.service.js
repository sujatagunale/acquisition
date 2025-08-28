import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '#config/database.js';
import { users } from '#models/users.model.js';
import { eq } from 'drizzle-orm';
import logger from '#config/logger.js';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m';

export class AuthService {
  static async hashPassword(password) {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  }

  static async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error comparing password:', error);
      throw new Error('Password comparison failed');
    }
  }

  static generateToken(payload) {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw new Error('Token generation failed');
    }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Error verifying JWT token:', error);
      throw new Error('Token verification failed');
    }
  }

  static async createUser({ name, email, password, role = 'user' }) {
    try {
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }

      const password_hash = await this.hashPassword(password);
      
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password_hash,
        role,
      }).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

      logger.info(`User created successfully: ${email}`);
      return newUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async authenticateUser(email, password) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await this.comparePassword(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // eslint-disable-next-line no-unused-vars
      const { password_hash, ...userWithoutPassword } = user;
      logger.info(`User authenticated successfully: ${email}`);
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error authenticating user:', error);
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
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }
}
