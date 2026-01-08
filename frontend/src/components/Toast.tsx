'use client';

import { useEffect } from 'react';
import { useToastStore } from '../store/toastStore';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

function ToastItem({ id, message, type, duration = 5000, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }[type];

  return (
    <div
      className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md animate-fade-in-right`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="text-white hover:text-gray-200 text-xl font-bold">
        ×
      </button>
    </div>
  );
}
