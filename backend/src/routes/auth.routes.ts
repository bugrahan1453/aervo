/**
 * Auth Routes
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updatePasswordSchema,
} from '../utils/validators';
import { authLimiter } from '../middlewares/rateLimit';

const router = Router();

// Public routes
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);

// Protected routes
router.get('/me', authenticate as any, authController.getMe);
router.put('/profile', authenticate as any, validateBody(updateUserSchema), authController.updateProfile);
router.post('/change-password', authenticate as any, validateBody(updatePasswordSchema), authController.changePassword);
router.post('/logout', authenticate as any, authController.logout);

export default router;
