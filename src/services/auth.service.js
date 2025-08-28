import bcrypt from 'bcrypt';
import { db } from '#config/database.js';
import { users } from '#models/users.model.js';
import { eq } from 'drizzle-orm';
import logger from '#config/logger.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
}

export async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Password comparison failed');
  }
}

export async function createUser({ name, email, password, role = 'user' }) {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const password_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: password_hash,
        role,
      })
      .returning({
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

export async function authenticateUser(email, password) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    logger.info(`User authenticated successfully: ${email}`);
    return user;
  } catch (error) {
    logger.error('Error authenticating user:', error);
    throw error;
  }
}
