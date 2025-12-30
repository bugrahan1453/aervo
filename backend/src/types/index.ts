/**
 * TypeScript Type Definitions
 */

import { Request } from 'express';
import { JWTPayload } from '../utils/jwt';

// ============================================
// EXPRESS EXTENSIONS
// ============================================

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// ORDER TYPES
// ============================================

export type CameraAngle = 'spiral' | 'zoom_in' | 'orbit' | 'flyover';

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  revenue: number;
}

export interface VideoRenderJob {
  orderId: string;
  address: string;
  latitude: number;
  longitude: number;
  duration: number;
  resolution: string;
  cameraAngles: CameraAngle[];
  hasLogo: boolean;
  logoUrl?: string;
  hasCustomMusic: boolean;
  customMusicUrl?: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface IyzicoPaymentRequest {
  orderId: string;
  price: number;
  paidPrice: number;
  currency: string;
  basketId: string;
  paymentCard: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
    registerCard: number;
  };
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
    ip: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: string;
    price: number;
  }>;
}

// ============================================
// EMAIL TYPES
// ============================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface SalesReport {
  date: string;
  orders: number;
  revenue: number;
  averageOrderValue: number;
}

export interface PopularLocationData {
  address: string;
  latitude: number;
  longitude: number;
  orderCount: number;
}

export interface PackageDistribution {
  packageType: string;
  count: number;
  percentage: number;
  revenue: number;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface AdminDashboardStats {
  todaySales: number;
  todayRevenue: number;
  weeklySales: number;
  weeklyRevenue: number;
  monthlySales: number;
  monthlyRevenue: number;
  activeRenders: number;
  queuedOrders: number;
  totalUsers: number;
  revenueChart: SalesReport[];
  popularLocations: PopularLocationData[];
  packageDistribution: PackageDistribution[];
}

// ============================================
// STORAGE TYPES
// ============================================

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  url: string;
}
