/**
 * EmlakDrone Database Seed
 * Creates initial data for development and production
 */

import { PrismaClient, UserRole, PackageType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. CREATE ADMIN USER
  // ============================================
  console.log('👤 Creating admin user...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@emlakdrone.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      emailVerified: true,
      role: UserRole.ADMIN,
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // ============================================
  // 2. CREATE PACKAGES
  // ============================================
  console.log('📦 Creating packages...');

  const packages = [
    {
      type: PackageType.STARTER,
      name: 'Başlangıç',
      description: 'Küçük projeler ve kişisel kullanım için ideal başlangıç paketi.',
      duration: 30,
      resolution: '1080p',
      maxAngles: 1,
      price: 299,
      features: [
        '30 saniye video',
        'Full HD (1080p) kalite',
        '1 kamera açısı',
        'Hazır müzik kütüphanesi',
        '24 saat teslimat',
      ],
      sortOrder: 1,
    },
    {
      type: PackageType.PROFESSIONAL,
      name: 'Profesyonel',
      description: 'İşletmeler ve emlak ofisleri için profesyonel çözüm.',
      duration: 60,
      resolution: '4K',
      maxAngles: 2,
      price: 599,
      features: [
        '60 saniye video',
        'Ultra HD (4K) kalite',
        '2 kamera açısı',
        'Hazır müzik kütüphanesi',
        'Logo ekleme dahil',
        '12 saat teslimat',
      ],
      sortOrder: 2,
    },
    {
      type: PackageType.ENTERPRISE,
      name: 'Kurumsal',
      description: 'Büyük projeler ve kurumsal müşteriler için en kapsamlı paket.',
      duration: 90,
      resolution: '4K',
      maxAngles: 4,
      price: 999,
      features: [
        '90 saniye video',
        'Ultra HD (4K) kalite',
        '4 kamera açısı',
        'Özel müzik seçimi',
        'Özel intro/outro',
        'Logo ekleme dahil',
        '6 saat öncelikli teslimat',
        'Öncelikli destek',
      ],
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { type: pkg.type },
      update: pkg,
      create: pkg,
    });
  }

  console.log(`✅ ${packages.length} package created`);

  // ============================================
  // 3. CREATE EMAIL TEMPLATES
  // ============================================
  console.log('📧 Creating email templates...');

  const emailTemplates = [
    {
      key: 'welcome',
      name: 'Hoş Geldiniz',
      subject: 'EmlakDrone\'a Hoş Geldiniz! 🚁',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚁 EmlakDrone'ya Hoş Geldiniz!</h1>
            </div>
            <div class="content">
              <p>Merhaba {{firstName}},</p>
              <p>EmlakDrone ailesine katıldığınız için çok mutluyuz! Sanal drone video platformumuzla, istediğiniz her lokasyonun muhteşem drone görüntülerini sadece birkaç tıkla elde edebilirsiniz.</p>
              <p><strong>Hemen başlayın:</strong></p>
              <ol>
                <li>İstediğiniz adresi girin</li>
                <li>Paketinizi seçin</li>
                <li>Kamera açısını belirleyin</li>
                <li>Videonuz hazır!</li>
              </ol>
              <a href="{{frontendUrl}}/siparis" class="button">İlk Siparişimi Oluştur</a>
              <p>Herhangi bir sorunuz olursa, bize ulaşmaktan çekinmeyin!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EmlakDrone. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    {
      key: 'order_confirmation',
      name: 'Sipariş Onayı',
      subject: 'Siparişiniz Alındı - {{orderNumber}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; color: #667eea; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Siparişiniz Alındı!</h1>
            </div>
            <div class="content">
              <p>Merhaba {{firstName}},</p>
              <p>Siparişiniz başarıyla oluşturuldu ve ödemeniz alındı. Video işleme sürecine başladık!</p>
              <div class="order-details">
                <h3>Sipariş Detayları</h3>
                <div class="detail-row">
                  <span>Sipariş No:</span>
                  <span><strong>{{orderNumber}}</strong></span>
                </div>
                <div class="detail-row">
                  <span>Paket:</span>
                  <span>{{packageName}}</span>
                </div>
                <div class="detail-row">
                  <span>Lokasyon:</span>
                  <span>{{address}}</span>
                </div>
                <div class="detail-row">
                  <span>Süre:</span>
                  <span>{{duration}} saniye</span>
                </div>
                <div class="detail-row">
                  <span>Çözünürlük:</span>
                  <span>{{resolution}}</span>
                </div>
                <div class="detail-row total">
                  <span>Toplam:</span>
                  <span>{{totalPrice}} TL</span>
                </div>
              </div>
              <p><strong>Tahmini teslimat:</strong> {{estimatedDelivery}}</p>
              <p>Videonuz hazır olduğunda size e-posta ile bildirim göndereceğiz.</p>
              <a href="{{frontendUrl}}/dashboard/siparisler" class="button">Siparişlerimi Görüntüle</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 EmlakDrone. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    {
      key: 'video_ready',
      name: 'Video Hazır',
      subject: '🎬 Videonuz Hazır - {{orderNumber}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .video-preview { text-align: center; margin: 20px 0; }
            .video-preview img { max-width: 100%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Videonuz Hazır!</h1>
            </div>
            <div class="content">
              <p>Merhaba {{firstName}},</p>
              <p>Harika haberlerimiz var! <strong>{{orderNumber}}</strong> numaralı siparişiniz tamamlandı ve videonuz hazır.</p>
              <div class="video-preview">
                <img src="{{thumbnailUrl}}" alt="Video Önizleme">
              </div>
              <p><strong>Sipariş Detayları:</strong></p>
              <ul>
                <li>Lokasyon: {{address}}</li>
                <li>Süre: {{duration}} saniye</li>
                <li>Çözünürlük: {{resolution}}</li>
              </ul>
              <div style="text-align: center;">
                <a href="{{frontendUrl}}/dashboard/videolar" class="button">Videoyu İzle & İndir</a>
              </div>
              <p>Hizmetimizden memnun kaldıysanız, arkadaşlarınızla paylaşmayı unutmayın! 🚁</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EmlakDrone. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    {
      key: 'order_failed',
      name: 'Sipariş Başarısız',
      subject: 'Siparişinizle İlgili Sorun - {{orderNumber}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Siparişinizle İlgili Sorun</h1>
            </div>
            <div class="content">
              <p>Merhaba {{firstName}},</p>
              <p>Maalesef <strong>{{orderNumber}}</strong> numaralı siparişinizin işlenmesinde bir sorun oluştu.</p>
              <div class="alert">
                <p><strong>Ne oldu?</strong></p>
                <p>Video oluşturma sürecinde teknik bir hata meydana geldi. Ekibimiz durumdan haberdar edildi ve sorunu inceliyor.</p>
              </div>
              <p><strong>Ne yapacağız?</strong></p>
              <ul>
                <li>Sorunu en kısa sürede çözeceğiz</li>
                <li>Siparişinizi yeniden işleme alacağız</li>
                <li>Ödemeniz güvende, iade işlemi yapılmayacak</li>
              </ul>
              <p>24 saat içinde sizinle iletişime geçeceğiz. Acil bir durumsa, destek ekibimize ulaşabilirsiniz.</p>
              <a href="mailto:destek@emlakdrone.io" class="button">Destek Ekibi ile İletişime Geç</a>
              <p>Anlayışınız için teşekkür ederiz.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EmlakDrone. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: template,
      create: template,
    });
  }

  console.log(`✅ ${emailTemplates.length} email templates created`);

  // ============================================
  // 4. CREATE SETTINGS
  // ============================================
  console.log('⚙️ Creating settings...');

  const settings = [
    // General
    { key: 'site_name', value: 'EmlakDrone', category: 'general' },
    { key: 'site_description', value: 'Sanal Drone Video Platformu', category: 'general' },
    { key: 'contact_email', value: 'info@emlakdrone.io', category: 'general' },
    { key: 'support_email', value: 'destek@emlakdrone.io', category: 'general' },
    { key: 'maintenance_mode', value: 'false', category: 'system' },

    // Pricing addons
    { key: 'addon_logo_price', value: '100', category: 'pricing' },
    { key: 'addon_custom_music_price', value: '150', category: 'pricing' },
    { key: 'addon_urgent_multiplier', value: '1.5', category: 'pricing' },

    // Email
    { key: 'email_enabled', value: 'true', category: 'email' },

    // Video processing
    { key: 'max_concurrent_renders', value: '2', category: 'system' },
    { key: 'video_retention_days', value: '30', category: 'system' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }

  console.log(`✅ ${settings.length} settings created`);

  // ============================================
  // DONE
  // ============================================
  console.log('\n✅ Database seed completed successfully!\n');
  console.log('📝 Admin credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('\n⚠️  Please change the admin password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
