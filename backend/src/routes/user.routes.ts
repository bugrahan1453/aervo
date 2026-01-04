/**
 * User Routes
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/packages', optionalAuth as any, userController.getPackages);

// Protected routes
router.get('/stats', authenticate as any, userController.getUserStats);
router.get('/invoices', authenticate as any, userController.getUserInvoices);

export default router;
