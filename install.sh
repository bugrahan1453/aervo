#!/bin/bash

##############################################
# AERVO - Otomatik Kurulum Scripti
# Tek komutla production-ready kurulum
##############################################

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logo
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║                                           ║
║        🚁 AERVO KURULUM BAŞLIYOR          ║
║                                           ║
║   Sanal Drone Video Platform Kurulumu     ║
║                                           ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Root kontrolü
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Bu script root olarak çalıştırılmalı!${NC}"
  echo "Kullanım: sudo bash install.sh"
  exit 1
fi

echo -e "${GREEN}✅ Root yetkisi doğrulandı${NC}\n"

# 1. Sistem Güncelleme
echo -e "${YELLOW}📦 Sistem güncelleniyor...${NC}"
apt update -qq
apt upgrade -y -qq
echo -e "${GREEN}✅ Sistem güncellendi${NC}\n"

# 2. Docker Kurulumu
echo -e "${YELLOW}🐳 Docker kuruluyor...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker kuruldu${NC}"
else
    echo -e "${GREEN}✅ Docker zaten kurulu${NC}"
fi

# 3. Docker Compose Kurulumu
echo -e "${YELLOW}🐳 Docker Compose kuruluyor...${NC}"
if ! command -v docker compose &> /dev/null; then
    apt install docker-compose-plugin -y -qq
    echo -e "${GREEN}✅ Docker Compose kuruldu${NC}"
else
    echo -e "${GREEN}✅ Docker Compose zaten kurulu${NC}"
fi

# 4. Gerekli Paketler
echo -e "${YELLOW}📦 Gerekli paketler kuruluyor...${NC}"
apt install -y -qq git curl wget nano htop certbot
echo -e "${GREEN}✅ Gerekli paketler kuruldu${NC}\n"

# 5. Proje Klasörü
INSTALL_DIR="/opt/aervo"
echo -e "${YELLOW}📁 Proje klasörü oluşturuluyor: ${INSTALL_DIR}${NC}"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  Klasör mevcut. Yedekleniyor...${NC}"
    mv "$INSTALL_DIR" "${INSTALL_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 6. Proje İndirme
echo -e "${YELLOW}📥 Aervo indiriliyor...${NC}"
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/bugrahan1453/aervo.git .
    git checkout claude/aervo-drone-platform-pKwxx
fi
echo -e "${GREEN}✅ Proje indirildi${NC}\n"

# 7. Environment Dosyası Oluşturma
echo -e "${YELLOW}⚙️  Environment dosyası yapılandırılıyor...${NC}"

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env mevcut. Yedekleniyor...${NC}"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Kullanıcıdan bilgi al
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   ℹ️  YAPILANDIRMA BİLGİLERİ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Domain
read -p "🌐 Domain adınız (örn: aervo.io): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    echo -e "${YELLOW}⚠️  Domain girilmedi, localhost kullanılacak${NC}"
fi

# Admin Email
read -p "📧 Admin email (örn: admin@aervo.io): " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    ADMIN_EMAIL="admin@aervo.io"
fi

# Admin Şifre
read -sp "🔐 Admin şifresi (min 8 karakter): " ADMIN_PASSWORD
echo ""
if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD="Admin123!ChangeThis"
    echo -e "${YELLOW}⚠️  Şifre girilmedi, varsayılan kullanılacak: Admin123!ChangeThis${NC}"
fi

# Google Maps API Key
echo ""
echo -e "${YELLOW}🗺️  Google Maps API Key gereklidir!${NC}"
echo "   Almak için: https://console.cloud.google.com"
read -p "🔑 Google Maps API Key: " GOOGLE_MAPS_KEY

# Güvenli şifreler oluştur
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
MINIO_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# .env dosyası oluştur
cat > .env << EOF
# ============================================
# AERVO - PRODUCTION ENVIRONMENT
# Otomatik oluşturuldu: $(date)
# ============================================

# ============ APPLICATION ============
NODE_ENV=production
APP_NAME=Aervo
APP_URL=https://api.${DOMAIN}
FRONTEND_URL=https://${DOMAIN}
BACKEND_URL=https://api.${DOMAIN}

# ============ DATABASE ============
DATABASE_URL=postgresql://aervo:${DB_PASSWORD}@postgres:5432/aervo
DB_PASSWORD=${DB_PASSWORD}

# ============ REDIS ============
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# ============ JWT & AUTH ============
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
REFRESH_TOKEN_EXPIRES_IN=30d

# ============ GOOGLE OAUTH (Opsiyonel) ============
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.${DOMAIN}/api/auth/google/callback

# ============ GOOGLE MAPS ============
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_KEY}

# ============ PAYMENT - IYZICO (Test) ============
IYZICO_API_KEY=sandbox-your-api-key
IYZICO_SECRET_KEY=sandbox-your-secret-key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# ============ EMAIL - SMTP ============
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Aervo
SMTP_FROM_EMAIL=noreply@${DOMAIN}

# ============ MINIO (S3 Storage) ============
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=aervo_admin
MINIO_SECRET_KEY=${MINIO_SECRET}
MINIO_BUCKET=aervo-videos
MINIO_USE_SSL=false

# ============ RATE LIMITING ============
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============ VIDEO PROCESSING ============
VIDEO_QUALITY_1080P=1920x1080
VIDEO_QUALITY_4K=3840x2160
VIDEO_FRAMERATE=30
VIDEO_BITRATE_1080P=5000k
VIDEO_BITRATE_4K=15000k
MAX_RENDER_RETRIES=3

# ============ QUEUE ============
QUEUE_CONCURRENCY=2

# ============ LOGGING ============
LOG_LEVEL=info

# ============ BACKUP ============
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# ============ ADMIN ============
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
EOF

echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}\n"

# Önemli bilgileri kaydet
cat > KURULUM_BİLGİLERİ.txt << EOF
═══════════════════════════════════════════
  🚁 AERVO KURULUM BİLGİLERİ
═══════════════════════════════════════════

📅 Kurulum Tarihi: $(date)
🌐 Domain: ${DOMAIN}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 GÜVENLİK BİLGİLERİ (GİZLİ TUTUN!)

Database Şifresi:
${DB_PASSWORD}

JWT Secret:
${JWT_SECRET}

MinIO Secret:
${MINIO_SECRET}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 ADMİN GİRİŞ BİLGİLERİ

Email: ${ADMIN_EMAIL}
Şifre: ${ADMIN_PASSWORD}

⚠️  İlk girişte şifrenizi değiştirin!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 ERİŞİM URL'LERİ

Frontend: https://${DOMAIN}
Backend API: https://api.${DOMAIN}
Admin Panel: https://${DOMAIN}/admin
Health Check: https://api.${DOMAIN}/health

MinIO Console: http://${DOMAIN}:9001
  Username: aervo_admin
  Password: ${MINIO_SECRET}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SONRAKI ADIMLAR

1. DNS ayarlarınızı yapın:
   A Record: @ -> Server IP
   A Record: www -> Server IP
   A Record: api -> Server IP

2. SSL sertifikası alın:
   cd /opt/aervo
   sudo bash ssl-setup.sh

3. Email SMTP ayarlarını yapın:
   nano /opt/aervo/.env
   (SMTP_USER ve SMTP_PASSWORD ekleyin)

4. Iyzico production keys alın:
   https://merchant.iyzipay.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 DESTEK

Dokümantasyon: /opt/aervo/README.md
Loglar: docker compose logs -f
Durum: docker compose ps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

chmod 600 KURULUM_BİLGİLERİ.txt

# 8. Docker Servisleri Başlat
echo -e "${YELLOW}🐳 Docker servisleri başlatılıyor...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d

# Servislerin hazır olmasını bekle
echo -e "${YELLOW}⏳ Servisler hazırlanıyor (30 saniye)...${NC}"
sleep 30

echo -e "${GREEN}✅ Docker servisleri başlatıldı${NC}\n"

# 9. Database Kurulumu
echo -e "${YELLOW}🗄️  Database kuruluyor...${NC}"

# Migrations
docker compose exec -T backend npx prisma migrate deploy

# Seed data
docker compose exec -T backend npm run prisma:seed

echo -e "${GREEN}✅ Database kuruldu${NC}\n"

# 10. Backup Script Oluştur
echo -e "${YELLOW}💾 Backup scripti oluşturuluyor...${NC}"

cat > /root/aervo-backup.sh << 'BACKUPEOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/aervo"
mkdir -p $BACKUP_DIR

# Database backup
cd /opt/aervo
docker compose exec -T postgres pg_dump -U aervo aervo | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Environment backup
cp .env $BACKUP_DIR/env_$DATE

# 30 günden eski backupları sil
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "env_*" -mtime +30 -delete

echo "✅ Backup tamamlandı: $DATE"
BACKUPEOF

chmod +x /root/aervo-backup.sh

# Cron job ekle
(crontab -l 2>/dev/null; echo "0 3 * * * /root/aervo-backup.sh") | crontab -

echo -e "${GREEN}✅ Otomatik backup kuruldu (her gün 03:00)${NC}\n"

# 11. Firewall (UFW)
echo -e "${YELLOW}🔥 Firewall yapılandırılıyor...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 9001/tcp
    echo -e "${GREEN}✅ Firewall yapılandırıldı${NC}"
else
    apt install -y ufw
    ufw --force enable
    ufw allow 22,80,443,9001/tcp
    echo -e "${GREEN}✅ Firewall kuruldu ve yapılandırıldı${NC}"
fi

echo ""

# 12. Fail2Ban (Brute Force Koruması)
echo -e "${YELLOW}🛡️  Fail2Ban kuruluyor...${NC}"
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << F2BEOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
F2BEOF

systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}✅ Fail2Ban kuruldu${NC}\n"

# 13. Yardımcı Scriptler Oluştur
echo -e "${YELLOW}🔧 Yardımcı scriptler oluşturuluyor...${NC}"

# SSL Setup Script
cat > ssl-setup.sh << 'SSLEOF'
#!/bin/bash
echo "🔒 SSL Sertifikası Kurulumu"
echo ""
read -p "Domain (örn: aervo.io): " DOMAIN
read -p "Email: " EMAIL

docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d $DOMAIN \
  -d www.$DOMAIN \
  -d api.$DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email

if [ $? -eq 0 ]; then
    echo "✅ SSL sertifikası alındı!"
    echo "🔄 Nginx yeniden başlatılıyor..."
    docker compose restart nginx
    echo "✅ Tamamlandı!"
else
    echo "❌ SSL sertifikası alınamadı!"
    echo "DNS ayarlarınızı kontrol edin ve tekrar deneyin."
fi
SSLEOF

# Update Script
cat > update.sh << 'UPDATEEOF'
#!/bin/bash
echo "🔄 Aervo Güncelleniyor..."
cd /opt/aervo
git pull
docker compose pull
docker compose up -d --build
echo "✅ Güncelleme tamamlandı!"
UPDATEEOF

# Status Script
cat > status.sh << 'STATUSEOF'
#!/bin/bash
echo "📊 Aervo Sistem Durumu"
echo ""
echo "🐳 Docker Containers:"
docker compose ps
echo ""
echo "💾 Disk Kullanımı:"
df -h /
echo ""
echo "🧠 RAM Kullanımı:"
free -h
echo ""
echo "📊 CPU Kullanımı:"
uptime
STATUSEOF

# Logs Script
cat > logs.sh << 'LOGSEOF'
#!/bin/bash
echo "📋 Aervo Logs"
echo ""
echo "Hangi servisi izlemek istiyorsunuz?"
echo "1) Tüm servisler"
echo "2) Backend"
echo "3) Frontend"
echo "4) Video Processor"
echo "5) Nginx"
read -p "Seçim (1-5): " choice

case $choice in
    1) docker compose logs -f ;;
    2) docker compose logs -f backend ;;
    3) docker compose logs -f frontend ;;
    4) docker compose logs -f video-processor ;;
    5) docker compose logs -f nginx ;;
    *) echo "Geçersiz seçim!" ;;
esac
LOGSEOF

# Restart Script
cat > restart.sh << 'RESTARTEOF'
#!/bin/bash
echo "🔄 Aervo Yeniden Başlatılıyor..."
cd /opt/aervo
docker compose restart
echo "✅ Yeniden başlatıldı!"
RESTARTEOF

chmod +x ssl-setup.sh update.sh status.sh logs.sh restart.sh

echo -e "${GREEN}✅ Yardımcı scriptler oluşturuldu${NC}\n"

# 14. Sistem Bilgileri
SERVER_IP=$(curl -s ifconfig.me)

# 15. Kurulum Tamamlandı!
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║                                           ║
║     ✅ KURULUM BAŞARIYLA TAMAMLANDI!      ║
║                                           ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 ÖNEMLİ BİLGİLER${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "🌐 Domain: ${GREEN}${DOMAIN}${NC}"
echo -e "📍 Server IP: ${GREEN}${SERVER_IP}${NC}"
echo -e "👤 Admin Email: ${GREEN}${ADMIN_EMAIL}${NC}"
echo -e "🔐 Admin Şifre: ${GREEN}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${YELLOW}⚠️  Admin şifresini ilk girişte değiştirin!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🌐 ERİŞİM URL'LERİ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DOMAIN" = "localhost" ]; then
    echo -e "Frontend: ${GREEN}http://${SERVER_IP}:3000${NC}"
    echo -e "Backend: ${GREEN}http://${SERVER_IP}:3001${NC}"
    echo -e "Health: ${GREEN}http://${SERVER_IP}:3001/health${NC}"
else
    echo -e "Frontend: ${GREEN}https://${DOMAIN}${NC} (SSL kurulumundan sonra)"
    echo -e "Backend: ${GREEN}https://api.${DOMAIN}${NC} (SSL kurulumundan sonra)"
    echo -e "Health: ${GREEN}http://${SERVER_IP}:3001/health${NC} (şimdi test edebilirsiniz)"
fi

echo -e "MinIO Console: ${GREEN}http://${SERVER_IP}:9001${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 SONRAKI ADIMLAR${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1️⃣  DNS Ayarları (Domain registrar'ınızda):"
echo -e "   ${GREEN}A Record:${NC} @ → ${SERVER_IP}"
echo -e "   ${GREEN}A Record:${NC} www → ${SERVER_IP}"
echo -e "   ${GREEN}A Record:${NC} api → ${SERVER_IP}"
echo ""
echo -e "2️⃣  SSL Sertifikası (DNS yayıldıktan sonra, ~30 dakika):"
echo -e "   ${GREEN}cd /opt/aervo${NC}"
echo -e "   ${GREEN}sudo bash ssl-setup.sh${NC}"
echo ""
echo -e "3️⃣  Email Ayarları (Gmail kullanıyorsanız):"
echo -e "   ${GREEN}nano /opt/aervo/.env${NC}"
echo -e "   SMTP_USER ve SMTP_PASSWORD ekleyin"
echo -e "   Gmail App Password: https://myaccount.google.com/apppasswords"
echo ""
echo -e "4️⃣  Iyzico Production Keys:"
echo -e "   https://merchant.iyzipay.com"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔧 YARDIMCI KOMUTLAR${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📊 Durum kontrol: ${GREEN}cd /opt/aervo && bash status.sh${NC}"
echo -e "📋 Logları izle: ${GREEN}cd /opt/aervo && bash logs.sh${NC}"
echo -e "🔄 Yeniden başlat: ${GREEN}cd /opt/aervo && bash restart.sh${NC}"
echo -e "⬆️  Güncelle: ${GREEN}cd /opt/aervo && bash update.sh${NC}"
echo -e "🔒 SSL kur: ${GREEN}cd /opt/aervo && bash ssl-setup.sh${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📄 DETAYLI BİLGİLER${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Tüm kurulum bilgileri: ${GREEN}/opt/aervo/KURULUM_BİLGİLERİ.txt${NC}"
echo -e "Detaylı dokümantasyon: ${GREEN}/opt/aervo/README.md${NC}"
echo ""
echo -e "${GREEN}✨ Aervo başarıyla kuruldu! İyi kullanımlar! 🚁${NC}"
echo ""
