'use client';

import { LoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={
        <div className="flex items-center justify-center p-4">
          <div className="text-gray-600">Google Maps yükleniyor...</div>
        </div>
      }
    >
      {children}
    </LoadScript>
  );
}
