import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import { authProtection, advancedProtection } from '#middlewares/arcjet.middleware.js';

const router = express.Router();

const authMiddleware = authProtection 
  ? advancedProtection() 
  : (req, res, next) => next();

router.post('/signup', authMiddleware, signup);
router.post('/signin', authMiddleware, signin);
router.post('/signout', signout);

export default router;
