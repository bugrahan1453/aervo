'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 41.0082, // Istanbul
  lng: 28.9784,
};

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setMarkerPosition({ lat, lng });

        // Reverse geocoding to get address
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });

          if (result.results[0]) {
            onLocationSelect(lat, lng, result.results[0].formatted_address);
          } else {
            onLocationSelect(lat, lng);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          onLocationSelect(lat, lng);
        }
      }
    },
    [onLocationSelect]
  );

  return (
    <div className="w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={markerPosition || defaultCenter}
        zoom={markerPosition ? 15 : 11}
        onLoad={onLoad}
        onClick={onClick}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
        }}
      >
        {markerPosition && <Marker position={markerPosition} />}
      </GoogleMap>

      <p className="mt-2 text-sm text-gray-600">
        💡 Haritada istediğiniz noktaya tıklayarak lokasyon seçebilirsiniz
      </p>
    </div>
  );
}
