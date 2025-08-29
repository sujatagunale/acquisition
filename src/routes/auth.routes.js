import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import {
  authBotProtection,
  handleArcjetResponse,
} from '#middlewares/arcjet.middleware.js';

const router = express.Router();

router.post('/signup', handleArcjetResponse(authBotProtection), signup);

router.post('/signin', handleArcjetResponse(authBotProtection), signin);

router.post('/signout', signout);

export default router;
