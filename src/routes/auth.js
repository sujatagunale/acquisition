import express from 'express';
import { AuthService } from '#services/authService.js';
import { jwtUtils } from '#utils/jwt.js';
import logger from '#config/logger.js';

const router = express.Router();

const validateSignupInput = (name, email, password) => {
  const errors = [];
  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};

const validateSigninInput = (email, password) => {
  const errors = [];
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  if (!password) {
    errors.push('Password is required');
  }
  
  return errors;
};

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const validationErrors = validateSignupInput(name, email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    const userRole = role === 'admin' ? 'admin' : 'user';
    
    const user = await AuthService.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
    });

    const token = jwtUtils.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.cookie('token', token, jwtUtils.getCookieOptions());

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
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const validationErrors = validateSigninInput(email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    const user = await AuthService.authenticateUser(
      email.toLowerCase().trim(), 
      password
    );

    const token = jwtUtils.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.cookie('token', token, jwtUtils.getCookieOptions());

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
    
    res.status(500).json({ error: 'Sign in failed' });
  }
});

router.post('/signout', (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info('User signed out successfully');
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    logger.error('Signout error:', error);
    res.status(500).json({ error: 'Sign out failed' });
  }
});

export default router;
