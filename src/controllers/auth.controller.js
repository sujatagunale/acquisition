import { AuthService } from '#services/auth.service.js';
import { jwtUtils } from '#utils/jwt.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import logger from '#config/logger.js';

export class AuthController {
  static async signup(req, res, next) {
    try {
      const { error, value } = signupSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message),
        });
      }

      const { name, email, password, role } = value;
      
      const user = await AuthService.createUser({
        name,
        email,
        password,
        role,
      });

      const token = jwtUtils.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
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
      
      next(error);
    }
  }

  static async signin(req, res, next) {
    try {
      const { error, value } = signinSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message),
        });
      }

      const { email, password } = value;
      
      const user = await AuthService.authenticateUser(email, password);

      const token = jwtUtils.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
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
      
      next(error);
    }
  }

  static async signout(req, res, next) {
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
      next(error);
    }
  }
}
