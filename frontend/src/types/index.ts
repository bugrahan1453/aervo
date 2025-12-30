/**
 * TypeScript Type Definitions for Frontend
 */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
}

export interface Package {
  id: string;
  type: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  description?: string;
  duration: number;
  resolution: string;
  maxAngles: number;
  price: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  address: string;
  latitude: number;
  longitude: number;
  packageType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  duration: number;
  resolution: string;
  cameraAngles: CameraAngle[];
  hasLogo: boolean;
  logoUrl?: string;
  hasCustomMusic: boolean;
  customMusicUrl?: string;
  isUrgent: boolean;
  basePrice: number;
  addonsPrice: number;
  urgentFee: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  paidAt?: string;
  user?: User;
}

export type CameraAngle = 'spiral' | 'zoom_in' | 'orbit' | 'flyover';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'QUEUED'
  | 'PROCESSING'
  | 'RENDERING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface CreateOrderData {
  address: string;
  latitude: number;
  longitude: number;
  packageType: Package['type'];
  cameraAngles: CameraAngle[];
  hasLogo?: boolean;
  logoUrl?: string;
  hasCustomMusic?: boolean;
  customMusicUrl?: string;
  isUrgent?: boolean;
}

export interface PaymentData {
  orderId: string;
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
}

export interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalSpent: number;
}

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
  popularLocations: any[];
  packageDistribution: any[];
}
