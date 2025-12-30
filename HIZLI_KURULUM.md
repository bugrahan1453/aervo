# 🚀 AERVO - HIZLI KURULUM REHBERİ

Hiçbir teknik bilgi gerektirmeden 10 dakikada kurulum!

## 📋 ADIM 1: Hosting Al (5 dakika)

### Hetzner Cloud (ÖNERİLEN)

1. **Hesap Aç**: https://console.hetzner.cloud
2. **"New Project"** → İsim: "Aervo"
3. **"Add Server"**:
   - 📍 **Location**: Falkenstein, Germany
   - 🖼️ **Image**: Ubuntu 22.04
   - 💻 **Type**: CPX31 (4 vCPU, 8 GB RAM) - €13.90/ay
   - 🔑 **SSH Keys**: "Skip" (şifre kullanacağız)
   - 🎛️ **Firewall**: "Create Firewall"
     - ✅ SSH (22)
     - ✅ HTTP (80)
     - ✅ HTTPS (443)
   - ➕ **Create & Buy Now**

4. **Server hazır!** IP adresini not edin (örn: `116.203.123.45`)
5. **Root şifre** email'inize gelecek

---

## 📋 ADIM 2: Domain Al (3 dakika) - OPSİYONEL

### Domain İstemiyorsanız
- IP ile kullanabilirsiniz: `http://116.203.123.45:3000`
- Bu adımı atlayın

### Domain İstiyorsanız (önerilir)

1. **GoDaddy** veya **Namecheap**'ten domain alın
   - Örnek: `aervo.io` (~$12/yıl)

2. **DNS Ayarları** (GoDaddy/Namecheap panelinde):
   ```
   A Record: @     →  116.203.123.45
   A Record: www   →  116.203.123.45
   A Record: api   →  116.203.123.45
   ```

3. DNS yayılması için **30 dakika** bekleyin

---

## 📋 ADIM 3: Server'a Bağlan (1 dakika)

### Windows Kullanıcıları

**PowerShell**'i açın (Windows tuşu + X → "Windows PowerShell"):

```powershell
ssh root@116.203.123.45
```

(IP'yi kendi IP'nizle değiştirin)

- "Are you sure?" → `yes` yazın
- **Şifre**: Email'den gelen root şifresi (yazarken görünmez, normal!)

### Mac/Linux Kullanıcıları

**Terminal**'i açın:

```bash
ssh root@116.203.123.45
```

---

## 📋 ADIM 4: TEK KOMUT KURULUM! (5 dakika)

Server'a bağlandıktan sonra **tek komut** yeterli:

```bash
curl -fsSL https://raw.githubusercontent.com/bugrahan1453/aervo/claude/aervo-drone-platform-pKwxx/install.sh | bash
```

### Kurulum Sırasında Sorulacaklar:

```
🌐 Domain adınız: aervo.io       (veya boş bırakın)
📧 Admin email: admin@aervo.io
🔐 Admin şifresi: ********        (güçlü bir şifre)
🗺️ Google Maps API Key: ****     (aşağıda nasıl alınır)
```

**Not:** Google Maps API Key almadıysanız boş bırakabilirsiniz, sonra eklersiniz.

### Kurulum Tamamlandı! 🎉

Script bittiğinde size **admin giriş bilgileri** ve **erişim URL'leri** gösterilecek.

---

## 📋 ADIM 5: Siteyi Aç! (hemen)

### Domain kullanıyorsanız (DNS yayıldıktan sonra):

```
https://aervo.io           (Frontend)
https://api.aervo.io       (Backend API)
```

### Domain kullanmıyorsanız (hemen çalışır):

```
http://116.203.123.45:3000    (Frontend)
http://116.203.123.45:3001    (Backend API)
```

**Admin Paneli:**
- URL: `/admin` (veya `http://IP:3000/admin`)
- Email: Kurulumda girdiğiniz
- Şifre: Kurulumda girdiğiniz

---

## 🔑 GOOGLE MAPS API KEY ALMA (5 dakika)

Video rendering için **zorunlu**!

### Adımlar:

1. **Google Cloud Console**: https://console.cloud.google.com

2. **Yeni Proje Oluştur**:
   - Sol üst → Proje seçin → "New Project"
   - İsim: "Aervo"
   - "Create"

3. **APIs & Services** → "Library":
   - "Maps JavaScript API" → Enable
   - "Geocoding API" → Enable
   - "Elevation API" → Enable
   - "Maps Static API" → Enable

4. **Credentials** → "Create Credentials" → "API Key"
   - API Key kopyalayın

5. **API Key'i Ekleyin**:
   ```bash
   ssh root@116.203.123.45
   cd /opt/aervo
   nano .env

   # GOOGLE_MAPS_API_KEY satırını bulup ekleyin:
   GOOGLE_MAPS_API_KEY=AIzaSy.......

   # Kaydet: Ctrl+X, Y, Enter

   # Servisleri yeniden başlat:
   docker compose restart
   ```

### Maliyet:
- İlk **$200 ücretsiz** kredi
- Sonra kullanım başına ödeme (~$5-15/ay)

---

## 📧 EMAIL AYARLARI (Gmail - 3 dakika)

Sipariş bildirimleri için gerekli.

### Gmail Kullanıyorsanız:

1. **2-Step Verification** aktif olmalı:
   https://myaccount.google.com/security

2. **App Password Oluştur**:
   https://myaccount.google.com/apppasswords
   - App: "Aervo Email"
   - **16 karakterli şifre** kopyalayın (örn: `abcd efgh ijkl mnop`)

3. **.env Dosyasına Ekle**:
   ```bash
   ssh root@116.203.123.45
   cd /opt/aervo
   nano .env

   # Bu satırları bulup doldurun:
   SMTP_USER=sizin@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop

   # Kaydet: Ctrl+X, Y, Enter

   # Yeniden başlat:
   docker compose restart backend
   ```

### Alternatif Email Servisleri:
- **SendGrid**: Ücretsiz 100 email/gün
- **Mailgun**: Ücretsiz 10,000 email/ay
- **AWS SES**: Çok ucuz

---

## 🔒 SSL SERTİFİKASI (Let's Encrypt - 2 dakika)

HTTPS için **ücretsiz SSL** sertifikası.

**Önce DNS yayıldığını kontrol edin:**
```bash
ping aervo.io
# Sunucu IP'nizi göstermeli
```

**SSL Kurulumu:**
```bash
ssh root@116.203.123.45
cd /opt/aervo
bash ssl-setup.sh
```

**Sorular:**
```
Domain: aervo.io
Email: admin@aervo.io
```

**Tamamlandı!** Artık `https://aervo.io` çalışır.

---

## 💳 İYZİCO ÖDEME ENTEGRASYONU

### Test Ortamı (Ücretsiz):

1. **Kayıt**: https://merchant.iyzipay.com/auth/register
2. **Sandbox Keys** al (Dashboard → API & Güvenlik)
3. **.env'ye ekle**:
   ```env
   IYZICO_API_KEY=sandbox-your-api-key
   IYZICO_SECRET_KEY=sandbox-your-secret-key
   ```

**Test Kartları:**
```
Kart: 5528 7900 0000 0008
CVC: 123
Son Kullanma: 12/2030
```

### Production (Gerçek Ödemeler):

1. **Ticari belgeler** gönder (iyzico destek)
2. **Onay** sonrası production keys al
3. **.env güncelle**:
   ```env
   IYZICO_BASE_URL=https://api.iyzipay.com
   ```

**Komisyon:** %2.99 + ₺0.25 (işlem başına)

---

## 🔧 YARDIMCI KOMUTLAR

Server'a bağlandığınızda kullanabileceğiniz komutlar:

```bash
# 📊 Sistem durumu
cd /opt/aervo && bash status.sh

# 📋 Logları izle
cd /opt/aervo && bash logs.sh

# 🔄 Yeniden başlat
cd /opt/aervo && bash restart.sh

# ⬆️  Güncelleme yap
cd /opt/aervo && bash update.sh

# 🔒 SSL ekle/yenile
cd /opt/aervo && bash ssl-setup.sh

# 🗑️  Tamamen kaldır
cd /opt
rm -rf aervo
docker compose down -v
```

---

## 🆘 SORUN GİDERME

### 1. Site açılmıyor

```bash
# Container'lar çalışıyor mu?
docker ps

# Logları kontrol et
docker compose logs -f

# Yeniden başlat
docker compose restart
```

### 2. Database hatası

```bash
# Database'i sıfırla
docker compose exec backend npx prisma migrate reset
docker compose exec backend npm run prisma:seed
```

### 3. Video render edilmiyor

```bash
# Video processor logları
docker compose logs -f video-processor

# Google Maps API key kontrol
cat /opt/aervo/.env | grep GOOGLE_MAPS
```

### 4. Email gönderilmiyor

```bash
# SMTP ayarları kontrol
cat /opt/aervo/.env | grep SMTP

# Backend logları
docker compose logs -f backend
```

### 5. Port 80/443 açılmıyor

```bash
# Firewall kontrol
ufw status

# Nginx logları
docker compose logs nginx
```

---

## 📞 DESTEK

### Dokümantasyon:
```bash
cat /opt/aervo/README.md
cat /opt/aervo/KURULUM_BİLGİLERİ.txt
```

### Loglar:
```bash
docker compose logs -f backend      # Backend logları
docker compose logs -f frontend     # Frontend logları
docker compose logs -f video-processor  # Video processor
```

### Durum:
```bash
docker compose ps       # Container durumları
docker stats           # Resource kullanımı
df -h                  # Disk kullanımı
free -h                # RAM kullanımı
```

---

## ✅ KONTROL LİSTESİ

Kurulumdan sonra kontrol edin:

- [ ] ✅ Site açılıyor (`https://aervo.io`)
- [ ] ✅ Admin panel çalışıyor (`/admin`)
- [ ] ✅ Health check OK (`https://api.aervo.io/health`)
- [ ] ✅ Google Maps API aktif (video sipariş test et)
- [ ] ✅ Email gönderiyor (test email)
- [ ] ✅ Test ödeme çalışıyor (iyzico sandbox)
- [ ] ✅ SSL sertifikası var (yeşil kilit)
- [ ] ✅ Backup çalışıyor (`ls /backup/aervo`)

---

## 💰 TOPLAM MALİYET

| Hizmet | Aylık |
|--------|-------|
| **Hetzner Server** | €13.90 (~₺550) |
| **Domain** | ~₺5 (~$12/yıl ÷ 12) |
| **Google Maps API** | $10-20 (~₺400-800) |
| **Email** | Ücretsiz (Gmail) |
| **SSL** | Ücretsiz (Let's Encrypt) |
| **Toplam** | **~₺950-1,350/ay** |

---

## 🎉 KURULUM TAMAMLANDI!

Artık production-ready sanal drone video platformunuz hazır! 🚁

**İlk Siparişinizi Test Edin:**
1. `https://aervo.io` → Kayıt Ol
2. Sipariş Oluştur → Adres girin
3. Paket seçin → Test kartı ile öde
4. Video işlenmeyi izleyin (Dashboard)

**Başarılar!** 🚀✨
