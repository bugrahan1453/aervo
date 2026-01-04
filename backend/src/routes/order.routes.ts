/**
 * Order Routes
 */

import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { createOrderSchema } from '../utils/validators';
import { orderLimiter } from '../middlewares/rateLimit';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

router.post('/', orderLimiter, validateBody(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.get('/:id/download', orderController.getDownloadUrl);

export default router;
