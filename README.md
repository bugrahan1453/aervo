# 🚁 EmlakDrone - Sanal Drone Video Platformu

Tam otomatik sanal drone video oluşturma platformu. Google Maps satellite görüntülerinden profesyonel drone videoları oluşturur.

## 🚀 Hızlı Başlangıç

```bash
# 1. Docker ile tüm sistemi başlat
docker compose up -d

# 2. Database migration
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# 3. Siteye giriş yap
# URL: https://emlakdrone.com/login
# Email: admin@emlakdrone.com
# Şifre: Admin123!
```

## 📦 Kurulum Detayları

Tüm kurulum adımları ve dokümantasyon için [INSTALLATION.md](./INSTALLATION.md) dosyasına bakın.

## 🔑 Gerekli API Keys (Zaten Yapılandırılmış)

✅ Google Maps API Key  
✅ İyzico Payment (Production)  
✅ Email SMTP (mail.glorins.com)  
✅ Google OAuth  

## 🎯 Özellikler

- Google Maps ile adres seçimi
- 3 paket (₺299, ₺599, ₺999)
- İyzico ödeme entegrasyonu
- Otomatik video rendering (Google Maps + FFmpeg)
- Email bildirimleri
- Admin paneli

## 📞 Destek

Email: info@glorins.com
