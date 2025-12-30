# 🚁 Aervo - Sanal Drone Video Platformu

**Production-ready sanal drone video platformu** - Kullanıcılar adres giriyor, sistem otomatik olarak o lokasyonun 3D/uydu görüntüsünden drone tarzı sinematik video üretiyor.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Sistem Mimarisi](#-sistem-mimarisi)
- [Kurulum](#-kurulum)
- [Yapılandırma](#-yapılandırma)
- [Kullanım](#-kullanım)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Deployment](#-deployment)

## ✨ Özellikler

### Kullanıcı Özellikleri

- **🎯 Kolay Sipariş Akışı**: Adres gir → Paket seç → Kamera açısı belirle → Öde → Video hazır
- **📦 3 Paket Seçeneği**:
  - **Başlangıç**: 30sn, 1080p, 1 açı - ₺299
  - **Profesyonel**: 60sn, 4K, 2 açı, müzik - ₺599
  - **Kurumsal**: 90sn, 4K, 4 açı, müzik, özel intro - ₺999
- **🎥 4 Kamera Açısı**:
  - Spiral İniş
  - Yakınlaştırma (Zoom In)
  - 360° Orbit
  - Flyover
- **🎨 Özelleştirme**:
  - Logo ekleme
  - Özel müzik yükleme
  - Acil teslimat (2-6 saat)
- **👤 Kullanıcı Dashboard**:
  - Aktif siparişler (durum takibi)
  - Tamamlanan videolar
  - Video izleme ve indirme (MP4, WebM)
  - Sipariş geçmişi
  - Fatura yönetimi

### Admin Özellikleri

- **📊 Kapsamlı Dashboard**:
  - Gerçek zamanlı satış ve gelir takibi
  - Haftalık/aylık grafikler
  - Kuyruk durumu
  - Sistem sağlığı (CPU, RAM, disk)
- **📝 Sipariş Yönetimi**:
  - Tüm siparişleri görüntüleme ve filtreleme
  - Manuel durum değiştirme
  - Yeniden render
  - İptal ve iade işlemleri
- **👥 Kullanıcı Yönetimi**:
  - Kullanıcı listesi ve detayları
  - Hesap engelleme/açma
- **⚙️ Ayarlar**:
  - Fiyat paketleri düzenleme
  - Email şablonları (WYSIWYG)
  - Genel sistem ayarları
- **📈 Raporlama**:
  - Satış raporları (Excel/PDF export)
  - Popüler lokasyonlar analizi
  - Paket dağılım istatistikleri

### Otomasyon

- **🤖 Tam Otomatik Video Pipeline**:
  1. Ödeme alındığında otomatik kuyrukta işleme alınır
  2. Google Maps/Mapbox'tan 3D tile/uydu verileri çekilir
  3. Seçilen açılar için kamera yolları oluşturulur
  4. FFmpeg ile video render edilir
  5. Müzik, logo, intro eklenir
  6. MinIO storage'a yüklenir
  7. Email bildirimi gönderilir
- **🔄 Hata Yönetimi**:
  - 3 kez otomatik retry
  - Başarısız siparişler için admin bildirimi
  - Dead letter queue
- **⚡ Performans**:
  - Redis caching
  - BullMQ queue sistemi
  - Paralel worker desteği
  - FIFO + öncelikli kuyruk

### Güvenlik

- ✅ Rate limiting (IP bazlı)
- ✅ CSRF koruması
- ✅ SQL injection koruması (Prisma ORM)
- ✅ XSS koruması
- ✅ Input validation (Zod)
- ✅ Helmet.js security headers
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ HTTPS/SSL (Let's Encrypt)

## 🛠 Teknoloji Stack

### Backend
- **Framework**: Node.js 20 + Express.js + TypeScript
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache & Queue**: Redis 7 + BullMQ
- **Auth**: JWT + Passport.js + bcrypt
- **Payment**: Iyzico SDK
- **Email**: Nodemailer + MJML templates
- **Storage**: MinIO (S3-compatible)
- **Validation**: Zod
- **Logging**: Winston

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Video Processing
- **Engine**: FFmpeg
- **Image Processing**: Sharp
- **3D/Maps**: Google Maps Static API / Mapbox
- **Queue**: BullMQ (Redis)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Logging**: Winston
- **Monitoring**: Built-in health checks

## 🏗 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX                                │
│              (Reverse Proxy + SSL/HTTPS)                     │
└──────────┬─────────────────────────────────┬────────────────┘
           │                                 │
           ▼                                 ▼
    ┌──────────────┐                 ┌─────────────┐
    │   FRONTEND   │                 │   BACKEND   │
    │  (Next.js)   │◄───────────────►│  (Express)  │
    └──────────────┘                 └──────┬──────┘
                                            │
                    ┌───────────────────────┼───────────────────┐
                    │                       │                   │
                    ▼                       ▼                   ▼
             ┌─────────────┐       ┌──────────────┐    ┌────────────┐
             │ PostgreSQL  │       │    Redis     │    │   MinIO    │
             │  (Database) │       │(Cache+Queue) │    │ (Storage)  │
             └─────────────┘       └──────┬───────┘    └────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │    VIDEO     │
                                   │  PROCESSOR   │
                                   │   (FFmpeg)   │
                                   └──────────────┘
```

### Video İşleme Akışı

```
[Kullanıcı Ödeme Yapar]
         │
         ▼
[Order → PAID Status]
         │
         ▼
[BullMQ Queue'ya Eklenir]
         │
         ▼
[Video Processor Worker Alır]
         │
         ├─► [Google Maps API'den Görüntü Çeker]
         │
         ├─► [Kamera Yolları Oluşturur]
         │
         ├─► [FFmpeg ile Video Render Eder]
         │
         ├─► [Müzik, Logo, Efekt Ekler]
         │
         ├─► [MinIO'ya Yükler]
         │
         └─► [Email Gönderir] → [COMPLETED]
```

## 🚀 Kurulum

### Gereksinimler

- Docker & Docker Compose
- Git
- Minimum 4GB RAM
- 20GB Disk Alanı

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/bugrahan1453/aervo.git
cd aervo
```

### 2. Environment Dosyasını Yapılandırın

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Veritabanı
DATABASE_URL=postgresql://aervo:your_secure_password@postgres:5432/aervo

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key

# Google OAuth (Opsiyonel)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps (Gerekli)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Iyzico Payment (Gerekli)
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@aervo.io
SMTP_PASSWORD=your_smtp_password

# MinIO
MINIO_SECRET_KEY=your_minio_secret_key_change_this

# Admin Kullanıcı
ADMIN_EMAIL=admin@aervo.io
ADMIN_PASSWORD=Admin123!ChangeThis
```

### 3. Servisleri Başlatın

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları izle
docker-compose logs -f
```

### 4. Veritabanını Hazırlayın

```bash
# Backend container'ına gir
docker-compose exec backend sh

# Migrations çalıştır
npx prisma migrate deploy

# Seed data (admin, paketler, email templates)
npm run prisma:seed

# Çık
exit
```

### 5. SSL Sertifikası (Production)

```bash
# Let's Encrypt sertifikası al
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d aervo.io \
  -d www.aervo.io \
  -d api.aervo.io \
  --email admin@aervo.io \
  --agree-tos \
  --no-eff-email
```

## 🎮 Kullanım

### Erişim URL'leri

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001
- **Health Check**: http://localhost:3001/health

### Admin Giriş

- **Email**: admin@aervo.io
- **Şifre**: Admin123! (seed dosyasında tanımlı)

⚠️ **ÖNEMLİ**: İlk giriş sonrası admin şifresini değiştirin!

### Test Kullanıcı Oluşturma

1. Frontend'e gidin: http://localhost:3000
2. "Kayıt Ol" butonuna tıklayın
3. Email ve şifre ile kayıt olun
4. Dashboard'a yönlendirileceksiniz

### Test Siparişi Oluşturma

1. "Sipariş Oluştur" sayfasına gidin
2. Bir adres girin (örn: "Galata Kulesi, İstanbul")
3. Paket seçin (Başlangıç, Profesyonel, Kurumsal)
4. Kamera açısı seçin (Spiral, Zoom, Orbit, Flyover)
5. İsteğe bağlı: Logo, özel müzik, acil teslimat
6. "Devam Et" → Ödeme bilgileri
7. Test kartı: (Iyzico sandbox kartları)
   - Kart No: 5528790000000008
   - CVC: 123
   - Son Kullanma: 12/2030

## 📡 API Dokümantasyonu

### Authentication

```bash
# Kayıt
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "Ad",
  "lastName": "Soyad"
}

# Giriş
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}

# Profil
GET /api/auth/me
Authorization: Bearer {token}
```

### Orders

```bash
# Sipariş oluştur
POST /api/orders
Authorization: Bearer {token}
{
  "address": "Galata Kulesi, İstanbul",
  "latitude": 41.0256,
  "longitude": 28.9744,
  "packageType": "STARTER",
  "cameraAngles": ["spiral", "zoom_in"]
}

# Siparişlerimi getir
GET /api/orders
Authorization: Bearer {token}

# Sipariş detayı
GET /api/orders/:id
Authorization: Bearer {token}
```

### Payment

```bash
# Ödeme yap
POST /api/payment/process
Authorization: Bearer {token}
{
  "orderId": "order_id",
  "cardHolderName": "Ad Soyad",
  "cardNumber": "5528790000000008",
  "expireMonth": "12",
  "expireYear": "2030",
  "cvc": "123",
  "billingAddress": {
    "contactName": "Ad Soyad",
    "city": "İstanbul",
    "country": "Turkey",
    "address": "Adres"
  }
}
```

### Admin

```bash
# Dashboard stats
GET /api/admin/dashboard
Authorization: Bearer {admin_token}

# Tüm siparişler
GET /api/admin/orders?page=1&limit=10&status=COMPLETED
Authorization: Bearer {admin_token}

# Sipariş durumu güncelle
PUT /api/admin/orders/:id/status
Authorization: Bearer {admin_token}
{
  "status": "COMPLETED"
}
```

## 🚢 Deployment

### Production Checklist

- [ ] `.env` dosyasını production değerleriyle güncelleyin
- [ ] Admin şifresini değiştirin
- [ ] SSL sertifikası yapılandırın (Let's Encrypt)
- [ ] Google Maps API anahtarını alın
- [ ] Iyzico production keys alın
- [ ] SMTP email servisini yapılandırın
- [ ] MinIO için güçlü şifreler kullanın
- [ ] Rate limiting ayarlarını kontrol edin
- [ ] Backup stratejisi oluşturun
- [ ] Monitoring kurulumu yapın

### Hetzner Dedicated Server Kurulumu

```bash
# 1. Sunucuya SSH ile bağlan
ssh root@your-server-ip

# 2. Docker kur
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Docker Compose kur
apt install docker-compose-plugin

# 4. Projeyi klonla
git clone https://github.com/bugrahan1453/aervo.git
cd aervo

# 5. .env yapılandır
cp .env.example .env
nano .env  # Düzenle

# 6. Başlat
docker-compose up -d

# 7. SSL sertifikası
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d aervo.io -d www.aervo.io -d api.aervo.io
```

### Backup

```bash
# Database backup (günlük cron job)
docker-compose exec postgres pg_dump -U aervo aervo > backup_$(date +%Y%m%d).sql

# MinIO backup (video files)
docker-compose exec minio mc mirror minio/aervo-videos /backup/videos
```

### Monitoring

```bash
# Container durumu
docker-compose ps

# Loglar
docker-compose logs -f backend
docker-compose logs -f video-processor

# Resource kullanımı
docker stats

# Health check
curl http://localhost:3001/health
```

## 📂 Proje Yapısı

```
aervo/
├── backend/                 # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Initial data
│   └── src/
│       ├── config/         # Database, Redis, env
│       ├── controllers/    # Request handlers
│       ├── middlewares/    # Auth, validation, error
│       ├── routes/         # API endpoints
│       ├── services/       # Business logic
│       ├── queues/         # BullMQ workers
│       └── utils/          # Helpers
│
├── frontend/               # Next.js 14 App
│   └── src/
│       ├── app/           # Pages (App Router)
│       ├── components/    # React components
│       ├── lib/           # API client, utils
│       ├── hooks/         # Custom hooks
│       └── store/         # Zustand stores
│
├── video-processor/       # FFmpeg video renderer
│   └── src/
│       ├── templates/    # Camera angle templates
│       └── utils/        # FFmpeg helpers
│
├── storage/              # Local file storage
├── docker-compose.yml    # Docker services
├── nginx.conf           # Nginx configuration
└── .env.example         # Environment template
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [BullMQ](https://docs.bullmq.io/)
- [FFmpeg](https://ffmpeg.org/)
- [shadcn/ui](https://ui.shadcn.com/)

## 📞 İletişim

- **Website**: https://aervo.io
- **Email**: info@aervo.io
- **Destek**: destek@aervo.io

---

**Aervo** ile hayalinizdeki lokasyonların muhteşem drone görüntülerini elde edin! 🚁✨
