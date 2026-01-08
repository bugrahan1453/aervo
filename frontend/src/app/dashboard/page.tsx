'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { orderApi, userApi } from '../../lib/api';
import type { Order, Package } from '../../types';
import OrderForm from '../../components/OrderForm';
import VideoPlayer from '../../components/VideoPlayer';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'settings'>('dashboard');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
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
    loadData();
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
      PENDING: { label: 'Beklemede', color: 'text-yellow-600', bgColor: 'bg-yellow-50', dotColor: 'bg-yellow-500' },
      PROCESSING: { label: 'İşleniyor', color: 'text-blue-600', bgColor: 'bg-blue-50', dotColor: 'bg-blue-500' },
      RENDERING: { label: 'Render', color: 'text-purple-600', bgColor: 'bg-purple-50', dotColor: 'bg-purple-500' },
      COMPLETED: { label: 'Tamamlandı', color: 'text-green-600', bgColor: 'bg-green-50', dotColor: 'bg-green-500' },
      FAILED: { label: 'Başarısız', color: 'text-red-600', bgColor: 'bg-red-50', dotColor: 'bg-red-500' },
      QUEUED: { label: 'Sırada', color: 'text-gray-600', bgColor: 'bg-gray-50', dotColor: 'bg-gray-500' },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const processingOrders = orders.filter(o => ['PROCESSING', 'RENDERING', 'QUEUED'].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">EmlakDrone</h1>
                  <p className="text-xs text-gray-500">Proje Yönetim Paneli</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.firstName || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition"
                >
                  Admin Panel
                </button>
              )}

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${activeTab === 'dashboard' ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            style={activeTab === 'dashboard' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${activeTab === 'projects' ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            style={activeTab === 'projects' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${activeTab === 'settings' ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            style={activeTab === 'settings' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <div className="flex-1"></div>

          <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">PROJELERİM</h2>
                  <p className="text-gray-600">Drone video projelerinizi yönetin ve takip edin</p>
                </div>
                <button
                  onClick={() => setShowOrderForm(!showOrderForm)}
                  className="px-6 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition flex items-center space-x-2"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Yeni Proje</span>
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{orders.length}</div>
                  <p className="text-sm text-gray-600">Toplam Proje</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{completedOrders.length}</div>
                  <p className="text-sm text-gray-600">Tamamlanan</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">{processingOrders.length}</div>
                  <p className="text-sm text-gray-600">İşleniyor</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">%{orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0}</div>
                  <p className="text-sm text-gray-600">Başarı Oranı</p>
                </div>
              </div>
            </div>

            {/* Order Form Modal */}
            {showOrderForm && (
              <div className="mb-8">
                <OrderForm
                  onSuccess={handleFormSuccess}
                  onCancel={() => setShowOrderForm(false)}
                />
              </div>
            )}

            {/* Projects Grid */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-200">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Henüz Proje Yok</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">İlk drone video projenizi oluşturarak başlayın. Hemen yeni bir proje ekleyin!</p>
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="px-8 py-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition inline-flex items-center space-x-2"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>İlk Projeyi Oluştur</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition group"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {order.thumbnailUrl ? (
                          <img src={order.thumbnailUrl} alt={order.orderNumber} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color} backdrop-blur-sm flex items-center space-x-1.5`}>
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`}></span>
                            <span>{statusInfo.label}</span>
                          </div>
                        </div>

                        {/* Play Button for Completed */}
                        {order.status === 'COMPLETED' && order.videoUrl && (
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition"
                            >
                              <svg className="w-8 h-8 text-purple-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">#{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{order.address}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="font-bold text-purple-600">₺{order.totalPrice}</div>
                        </div>

                        {order.status === 'COMPLETED' && order.videoUrl && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition"
                          >
                            Videoyu İzle & İndir
                          </button>
                        )}

                        {['PROCESSING', 'RENDERING', 'QUEUED'].includes(order.status) && (
                          <div className="w-full mt-4 px-4 py-2.5 bg-orange-50 text-orange-700 font-medium rounded-xl text-center text-sm flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Video hazırlanıyor...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Video Player Modal */}
      {selectedOrder && selectedOrder.videoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">#{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.address}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white rounded-xl transition"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <VideoPlayer
                videoUrl={selectedOrder.videoUrl}
                thumbnailUrl={selectedOrder.thumbnailUrl}
              />
              <div className="mt-6 flex space-x-3">
                <a
                  href={selectedOrder.videoUrl}
                  download
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition text-center"
                >
                  Videoyu İndir
                </a>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
