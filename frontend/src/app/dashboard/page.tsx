'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { orderApi, userApi } from '../../lib/api';
import type { Order, Package } from '../../types';
import OrderForm from '../../components/OrderForm';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      const [ordersData, packagesData]: any = await Promise.all([
        orderApi.getMyOrders(),
        userApi.getPackages(),
      ]);

      if (ordersData.success) {
        setOrders(ordersData.data || []);
      }
      if (packagesData.success) {
        setPackages(packagesData.data || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleFormSuccess = () => {
    setShowOrderForm(false);
    loadData(); // Siparişleri yeniden yükle
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ED</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">EmlakDrone</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              Hoş geldin, {user?.firstName || user?.email}
            </span>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-primary text-white p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-lg opacity-90">
            Siparişlerinizi yönetin ve yeni drone videoları oluşturun
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Sipariş</p>
                <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tamamlanan</p>
                <p className="text-3xl font-bold text-green-600">
                  {orders.filter((o) => o.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">İşleniyor</p>
                <p className="text-3xl font-bold text-orange-600">
                  {orders.filter((o) => ['PROCESSING', 'RENDERING', 'QUEUED'].includes(o.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* New Order Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowOrderForm(!showOrderForm)}
            className="px-8 py-4 bg-gradient-primary text-white text-lg font-semibold rounded-lg hover:opacity-90 transition shadow-lg"
          >
            {showOrderForm ? '❌ İptal Et' : '✨ Yeni Sipariş Oluştur'}
          </button>
        </div>

        {/* Order Form */}
        {showOrderForm && (
          <div className="mb-8">
            <OrderForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowOrderForm(false)}
            />
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Siparişlerim</h3>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">Henüz siparişiniz yok</p>
              <p className="text-gray-500 mt-2">Yeni bir sipariş oluşturarak başlayın!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">#{order.orderNumber}</h4>
                      <p className="text-gray-600">{order.address}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'RENDERING' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Paket:</span>
                      <span className="ml-2 font-semibold">{order.packageType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fiyat:</span>
                      <span className="ml-2 font-semibold">₺{order.totalPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tarih:</span>
                      <span className="ml-2">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  {order.status === 'COMPLETED' && order.videoUrl && (
                    <div className="mt-4">
                      <a
                        href={order.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        🎥 Videoyu İndir
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
