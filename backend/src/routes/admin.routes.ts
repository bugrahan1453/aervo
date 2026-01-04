/**
 * Admin Routes
 */

import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import {
  updateOrderStatusSchema,
  updateSettingSchema,
  updateEmailTemplateSchema,
  updatePackageSchema,
} from '../utils/validators';

const router = Router();

// All routes require admin authentication
router.use(authenticate as any);
router.use(requireAdmin as any);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Orders
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', validateBody(updateOrderStatusSchema), adminController.updateOrderStatus);
router.post('/orders/:id/retry', adminController.retryOrder);
router.post('/orders/:id/refund', adminController.refundOrder);

// Users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', adminController.toggleBlockUser);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', validateBody(updateSettingSchema), adminController.updateSetting);

// Email templates
router.get('/email-templates', adminController.getEmailTemplates);
router.put('/email-templates/:key', validateBody(updateEmailTemplateSchema), adminController.updateEmailTemplate);

// Packages
router.get('/packages', adminController.getPackages);
router.put('/packages/:id', validateBody(updatePackageSchema), adminController.updatePackage);

// Reports
router.get('/reports/sales', adminController.getSalesReport);

// System
router.get('/system/health', adminController.getSystemHealth);

export default router;
