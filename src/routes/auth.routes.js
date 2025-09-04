import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import { signupValidationMiddleware, signinValidationMiddleware } from '#middlewares/custom-validation.middleware.js';

const router = express.Router();

router.post('/signup', signupValidationMiddleware, signup);
router.post('/signin', signinValidationMiddleware, signin);
router.post('/signout', signout);

export default router;
