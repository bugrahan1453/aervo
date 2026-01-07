'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ED</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">EmlakDrone</h1>
          </div>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">
                  Hoş geldin, {user?.firstName || user?.email}
                </span>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Sanal Drone ile Emlak Görüntüleme
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Google Earth üzerinden profesyonel drone videoları oluşturun.
            Gerçek drone'a gerek yok!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hızlı Üretim</h3>
            <p className="text-gray-600">
              Dakikalar içinde profesyonel drone videoları
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Uygun Fiyat</h3>
            <p className="text-gray-600">
              Gerçek drone çekiminden çok daha ekonomik
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Kolay Kullanım</h3>
            <p className="text-gray-600">
              Sadece adres seçin, geri kalanı bize bırakın
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">
            Hemen Başlayın
          </h3>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Emlak ilanlarınız için profesyonel drone videoları oluşturun.
            Dakikalar içinde hazır!
          </p>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-gradient-primary text-white text-lg font-semibold rounded-lg hover:opacity-90 transition"
            >
              Yeni Sipariş Oluştur
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-primary text-white text-lg font-semibold rounded-lg hover:opacity-90 transition"
            >
              Ücretsiz Kayıt Ol
            </Link>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 EmlakDrone. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
