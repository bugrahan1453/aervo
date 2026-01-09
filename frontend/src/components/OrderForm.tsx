'use client';

import { useState, useEffect } from 'react';
import { orderApi, userApi } from '../lib/api';
import type { Package, CameraAngle, CreateOrderData } from '../types';
import AddressSearch from './AddressSearch';
import MapPicker from './MapPicker';
import { useToastStore } from '../store/toastStore';

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState<CreateOrderData>({
    address: '',
    latitude: 0,
    longitude: 0,
    packageType: 'STARTER',
    cameraAngles: ['spiral'],
    hasLogo: false,
    hasCustomMusic: false,
    isUrgent: false,
  });

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [formData, selectedPackage]);

  const loadPackages = async () => {
    try {
      const response: any = await userApi.getPackages();
      if (response.success && response.data) {
        setPackages(response.data);
        const starter = response.data.find((p: Package) => p.type === 'STARTER');
        if (starter) setSelectedPackage(starter);
      }
    } catch (err) {
      console.error('Paket yükleme hatası:', err);
    }
  };

  const calculatePrice = () => {
    if (!selectedPackage) return;

    let price = selectedPackage.price;

    // Ek özellikler (örnek fiyatlar)
    if (formData.hasLogo) price += 50;
    if (formData.hasCustomMusic) price += 30;
    if (formData.isUrgent) price += 100;

    setCalculatedPrice(price);
  };

  const handlePackageChange = (packageType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    setFormData({ ...formData, packageType });
    const pkg = packages.find(p => p.type === packageType);
    if (pkg) setSelectedPackage(pkg);
  };

  const handleCameraAngleToggle = (angle: CameraAngle) => {
    const angles = formData.cameraAngles.includes(angle)
      ? formData.cameraAngles.filter(a => a !== angle)
      : [...formData.cameraAngles, angle];

    setFormData({ ...formData, cameraAngles: angles });
  };

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    setFormData({
      ...formData,
      address,
      latitude: lat,
      longitude: lng,
    });
    addToast('Adres seçildi: ' + address, 'success');
  };

  const handleMapLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng,
      address: address || formData.address,
    });
    if (address) {
      addToast('Lokasyon haritadan seçildi', 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.address) {
      setError('Lütfen adres girin');
      setLoading(false);
      return;
    }

    if (formData.cameraAngles.length === 0) {
      setError('Lütfen en az bir kamera açısı seçin');
      setLoading(false);
      return;
    }

    try {
      const response: any = await orderApi.create(formData);

      if (response.success && response.data) {
        // Check if it's a free package (price = 0)
        const isFree = calculatedPrice === 0 || response.data.totalPrice === 0;

        if (isFree) {
          // Free package - no payment needed, video processing starts immediately
          addToast('Ücretsiz sipariş oluşturuldu! Video hazırlanmaya başladı.', 'success');

          setTimeout(() => {
            if (onSuccess) onSuccess();
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          // Paid package - redirect to payment page
          addToast('Sipariş oluşturuldu! Ödeme sayfasına yönlendiriliyorsunuz...', 'success');

          setTimeout(() => {
            window.location.href = `/payment/${response.data.id}`;
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sipariş oluşturulurken hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Drone Videosu Siparişi</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Adres - Google Maps */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 Adres Seçimi
          </label>
          <AddressSearch
            onAddressSelect={handleAddressSelect}
            initialValue={formData.address}
          />

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showMap ? '🔼 Haritayı Gizle' : '🗺️ Haritadan Seç'}
          </button>

          {showMap && (
            <div className="mt-4">
              <MapPicker
                onLocationSelect={handleMapLocationSelect}
                initialLat={formData.latitude || undefined}
                initialLng={formData.longitude || undefined}
              />
            </div>
          )}

          {formData.address && (
            <p className="mt-2 text-sm text-green-600">
              ✅ Seçilen adres: {formData.address}
            </p>
          )}
        </div>

        {/* Paket Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            📦 Paket Seçimi
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handlePackageChange(pkg.type)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.packageType === pkg.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h4 className="font-bold text-lg mb-1">{pkg.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                <div className="text-2xl font-bold text-blue-600">₺{pkg.price}</div>
                <ul className="mt-2 text-xs text-gray-500 space-y-1">
                  <li>⏱️ {pkg.duration} saniye</li>
                  <li>📹 {pkg.resolution}</li>
                  <li>📐 Max {pkg.maxAngles} açı</li>
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Kamera Açıları */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🎥 Kamera Açıları (Max {selectedPackage?.maxAngles || 1})
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { id: 'spiral', name: 'Spiral', icon: '🌀' },
              { id: 'zoom_in', name: 'Yakınlaşma', icon: '🔍' },
              { id: 'orbit', name: 'Yörünge', icon: '🔄' },
              { id: 'flyover', name: 'Uçuş', icon: '✈️' },
            ].map((angle) => (
              <label
                key={angle.id}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                  formData.cameraAngles.includes(angle.id as CameraAngle)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                } ${
                  formData.cameraAngles.length >= (selectedPackage?.maxAngles || 1) &&
                  !formData.cameraAngles.includes(angle.id as CameraAngle)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.cameraAngles.includes(angle.id as CameraAngle)}
                  onChange={() => handleCameraAngleToggle(angle.id as CameraAngle)}
                  disabled={
                    formData.cameraAngles.length >= (selectedPackage?.maxAngles || 1) &&
                    !formData.cameraAngles.includes(angle.id as CameraAngle)
                  }
                  className="mr-3 w-5 h-5"
                />
                <span className="text-xl mr-2">{angle.icon}</span>
                <span className="font-medium">{angle.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ek Özellikler */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ✨ Ek Özellikler
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
              <input
                type="checkbox"
                checked={formData.hasLogo}
                onChange={(e) => setFormData({ ...formData, hasLogo: e.target.checked })}
                className="mr-3 w-5 h-5"
              />
              <span className="flex-1">
                <span className="font-medium">Logo Ekle</span>
                <span className="text-sm text-gray-500 ml-2">(+₺50)</span>
              </span>
            </label>

            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
              <input
                type="checkbox"
                checked={formData.hasCustomMusic}
                onChange={(e) => setFormData({ ...formData, hasCustomMusic: e.target.checked })}
                className="mr-3 w-5 h-5"
              />
              <span className="flex-1">
                <span className="font-medium">Özel Müzik</span>
                <span className="text-sm text-gray-500 ml-2">(+₺30)</span>
              </span>
            </label>

            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                className="mr-3 w-5 h-5"
              />
              <span className="flex-1">
                <span className="font-medium">Acil Teslimat (24 saat)</span>
                <span className="text-sm text-gray-500 ml-2">(+₺100)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Fiyat Özeti */}
        <div className="bg-gradient-primary text-white p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Toplam Tutar</span>
            <span className="text-3xl font-bold">₺{calculatedPrice}</span>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : '🚀 Siparişi Oluştur ve Ödemeye Geç'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              İptal
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
