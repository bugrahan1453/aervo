import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Toast from '../components/Toast';
import { GoogleMapsProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EmlakDrone - Sanal Drone ile Emlak Görüntüleme',
  description: 'Google Earth üzerinden sanal drone videoları oluşturun',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <GoogleMapsProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {children}
            <Toast />
          </div>
        </GoogleMapsProvider>
      </body>
    </html>
  );
}
