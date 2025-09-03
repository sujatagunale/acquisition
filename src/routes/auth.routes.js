import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import { rateLimitAuth, sensitiveDetector } from '#config/arcjet.js';

const router = express.Router();

const authLimiter = rateLimitAuth();
const sensitive = sensitiveDetector();

router.post('/signup', authLimiter, sensitive, signup);
router.post('/signin', authLimiter, sensitive, signin);
router.post('/signout', signout);

export default router;
