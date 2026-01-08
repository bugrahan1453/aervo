'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const libraries: ('places')[] = ['places'];

interface AddressSearchProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  initialValue?: string;
}

export default function AddressSearch({ onAddressSelect, initialValue = '' }: AddressSearchProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const address = place.formatted_address || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setInputValue(address);
        onAddressSelect(address, lat, lng);
      }
    }
  }, [autocomplete, onAddressSelect]);

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div>Yükleniyor...</div>}
    >
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: 'tr' }, // Sadece Türkiye
          fields: ['formatted_address', 'geometry', 'name'],
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Adres girin veya haritadan seçin..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </Autocomplete>
    </LoadScript>
  );
}
