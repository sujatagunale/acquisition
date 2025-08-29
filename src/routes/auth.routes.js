import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import { authProtection, emailValidation } from '#middlewares/arcjet.middleware.js';

const router = express.Router();

router.use(authProtection);

router.use(['/signup', '/signin'], emailValidation);

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);

export default router;
