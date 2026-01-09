'use client';

import { useState } from 'react';
import { paymentApi } from '../lib/api';

interface PaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PaymentForm({ orderId, amount, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: '',
    contactName: '',
    city: '',
    country: 'Türkiye',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData({ ...formData, [name]: formatted });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentData = {
        orderId,
        cardHolderName: formData.cardHolderName,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expireMonth: formData.expireMonth,
        expireYear: formData.expireYear,
        cvc: formData.cvc,
        billingAddress: {
          contactName: formData.contactName,
          city: formData.city,
          country: formData.country,
          address: formData.address,
        },
      };

      const response: any = await paymentApi.process(paymentData);

      if (response.success) {
        // İyzico 3D Secure varsa iframe'de aç
        if (response.data.threeDSHtmlContent) {
          const newWindow = window.open('', '_blank', 'width=600,height=600');
          if (newWindow) {
            newWindow.document.write(response.data.threeDSHtmlContent);
            newWindow.document.close();

            // 3D Secure tamamlandıktan sonra kontrol et
            const checkInterval = setInterval(async () => {
              try {
                const statusResponse: any = await paymentApi.getStatus(orderId);
                if (statusResponse.success && statusResponse.data.paymentStatus === 'COMPLETED') {
                  clearInterval(checkInterval);
                  newWindow.close();
                  if (onSuccess) onSuccess();
                }
              } catch (err) {
                // Kontrol devam eder
              }
            }, 2000);

            // 5 dakika sonra timeout
            setTimeout(() => {
              clearInterval(checkInterval);
              newWindow.close();
            }, 300000);
          }
        } else {
          // 3D Secure yoksa direkt başarılı
          if (onSuccess) onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Ödeme işlemi başarısız';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💳 Kart Bilgileri</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kart Sahibinin Adı
            </label>
            <input
              type="text"
              name="cardHolderName"
              value={formData.cardHolderName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="AHMET YILMAZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kart Numarası
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              required
              maxLength={19}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="1234 5678 9012 3456"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ay</label>
              <input
                type="text"
                name="expireMonth"
                value={formData.expireMonth}
                onChange={handleChange}
                required
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
              <input
                type="text"
                name="expireYear"
                value={formData.expireYear}
                onChange={handleChange}
                required
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                type="text"
                name="cvc"
                value={formData.cvc}
                onChange={handleChange}
                required
                maxLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📍 Fatura Adresi</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-primary text-white p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg">Ödenecek Tutar</span>
          <span className="text-3xl font-bold">₺{amount}</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Ödeme İşleniyor...' : '🔒 Güvenli Ödeme Yap'}
        </button>

        <p className="text-center text-sm mt-4 opacity-90">
          🔐 256-bit SSL ile güvenli ödeme
        </p>
      </div>
    </form>
  );
}
