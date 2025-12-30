/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency (Turkish Lira)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: Date | string, formatStr: string = 'PPP'): string => {
  return format(new Date(date), formatStr, { locale: tr });
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Az önce';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} dakika önce`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} saat önce`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} gün önce`;
  } else {
    return formatDate(date, 'dd MMM yyyy');
  }
};

/**
 * Get order status color
 */
export const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    PAID: 'bg-blue-500',
    QUEUED: 'bg-indigo-500',
    PROCESSING: 'bg-purple-500',
    RENDERING: 'bg-violet-500',
    COMPLETED: 'bg-green-500',
    FAILED: 'bg-red-500',
    CANCELLED: 'bg-gray-500',
    REFUNDED: 'bg-orange-500',
  };
  return colors[status] || 'bg-gray-500';
};

/**
 * Get order status label
 */
export const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: 'Ödeme Bekliyor',
    PAID: 'Ödendi',
    QUEUED: 'Kuyrukta',
    PROCESSING: 'İşleniyor',
    RENDERING: 'Render Ediliyor',
    COMPLETED: 'Tamamlandı',
    FAILED: 'Başarısız',
    CANCELLED: 'İptal Edildi',
    REFUNDED: 'İade Edildi',
  };
  return labels[status] || status;
};

/**
 * Get package type label
 */
export const getPackageLabel = (type: string): string => {
  const labels: Record<string, string> = {
    STARTER: 'Başlangıç',
    PROFESSIONAL: 'Profesyonel',
    ENTERPRISE: 'Kurumsal',
  };
  return labels[type] || type;
};

/**
 * Get camera angle label
 */
export const getCameraAngleLabel = (angle: string): string => {
  const labels: Record<string, string> = {
    spiral: 'Spiral İniş',
    zoom_in: 'Yakınlaştırma',
    orbit: '360° Orbit',
    flyover: 'Uçuş',
  };
  return labels[angle] || angle;
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Download file
 */
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
