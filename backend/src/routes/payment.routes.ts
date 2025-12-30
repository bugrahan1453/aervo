/**
 * Payment Routes
 */

import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { createPaymentSchema } from '../utils/validators';
import { paymentLimiter } from '../middlewares/rateLimit';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/process', paymentLimiter, validateBody(createPaymentSchema), paymentController.processPayment);
router.get('/:orderId/status', paymentController.getPaymentStatus);

export default router;
