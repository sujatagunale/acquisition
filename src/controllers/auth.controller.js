import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';
import { formatValidationError } from '#utils/format.js';
import * as authService from '#services/auth.service.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await authService.createUser({
      name,
      email,
      password,
      role,
    });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${user.email}`);
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Signup error:', error);

    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }

    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const user = await authService.authenticateUser(email, password);

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${user.email}`);
    res.json({
      message: 'Signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Signin error:', error);

    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');

    logger.info('User signed out successfully');
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    logger.error('Signout error:', error);
    next(error);
  }
};
