'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderApi, paymentApi } from '../../../lib/api';
import type { Order } from '../../../types';
import PaymentForm from '../../../components/PaymentForm';
import { useToastStore } from '../../../store/toastStore';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { addToast } = useToastStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response: any = await orderApi.getOrder(orderId);

      if (response.success && response.data) {
        setOrder(response.data);

        // If already paid, redirect to dashboard
        if (response.data.paymentStatus === 'COMPLETED') {
          addToast('Bu sipariş zaten ödendi!', 'info');
          router.push('/dashboard');
          return;
        }
      } else {
        setError('Sipariş bulunamadı');
      }
    } catch (err: any) {
      setError(err.message || 'Sipariş yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    addToast('Ödeme başarılı! Videonuz hazırlanmaya başlandı.', 'success');
    router.push('/dashboard');
  };

  const handlePaymentError = (errorMessage: string) => {
    addToast(errorMessage, 'error');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Dashboard'a Dön</span>
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">ED</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ödeme</h1>
              <p className="text-gray-600">Sipariş #{order.orderNumber}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Sipariş Özeti</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Adres</p>
                    <p className="text-gray-900 font-medium">{order.address}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Paket</p>
                    <p className="text-gray-900 font-medium">{order.packageType}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Sipariş Tarihi</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Ek Özellikler</h4>
                <div className="space-y-2 text-sm">
                  {order.hasLogo && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Logo Ekleme</span>
                      <span className="font-semibold text-gray-900">₺50</span>
                    </div>
                  )}
                  {order.hasCustomMusic && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Özel Müzik</span>
                      <span className="font-semibold text-gray-900">₺30</span>
                    </div>
                  )}
                  {order.isUrgent && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Acil Teslimat</span>
                      <span className="font-semibold text-gray-900">₺100</span>
                    </div>
                  )}
                  {!order.hasLogo && !order.hasCustomMusic && !order.isUrgent && (
                    <p className="text-gray-500 text-sm">Ek özellik seçilmedi</p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-100">Toplam Tutar</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold">₺{order.totalPrice}</div>
                  </div>
                </div>
                <p className="text-xs text-blue-100 mt-2">KDV Dahil</p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Güvenli Ödeme</h4>
                    <p className="text-xs text-blue-700">
                      Ödemeniz iyzico güvencesi altında 256-bit SSL ile şifrelenir
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <PaymentForm
              orderId={order.id}
              amount={order.totalPrice}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
