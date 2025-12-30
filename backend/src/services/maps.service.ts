/**
 * Maps Service
 * Handles Google Maps API interactions
 */

import { env } from '../config/env';
import { logger } from '../utils/logger';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const ELEVATION_URL = 'https://maps.googleapis.com/maps/api/elevation/json';
const STATIC_MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap';

/**
 * Geocode address to coordinates
 */
export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number; formattedAddress: string }> => {
  try {
    const response = await axios.get(GEOCODING_URL, {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      throw new Error('Adres bulunamadı');
    }

    const result = response.data.results[0];
    const { lat, lng } = result.geometry.location;

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    logger.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await axios.get(GEOCODING_URL, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      throw new Error('Adres bulunamadı');
    }

    return response.data.results[0].formatted_address;
  } catch (error) {
    logger.error('Reverse geocoding error:', error);
    throw error;
  }
};

/**
 * Get elevation data for coordinates
 */
export const getElevation = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  try {
    const response = await axios.get(ELEVATION_URL, {
      params: {
        locations: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      throw new Error('Yükseklik verisi alınamadı');
    }

    return response.data.results[0].elevation;
  } catch (error) {
    logger.error('Elevation error:', error);
    throw error;
  }
};

/**
 * Get static map image URL
 */
export const getStaticMapUrl = (
  latitude: number,
  longitude: number,
  zoom: number = 15,
  width: number = 600,
  height: number = 400
): string => {
  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    maptype: 'satellite',
    markers: `color:red|${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY || '',
  });

  return `${STATIC_MAP_URL}?${params.toString()}`;
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (
  latitude: number,
  longitude: number
): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Calculate distance between two points (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Get location metadata (city, country, etc.)
 */
export const getLocationMetadata = async (
  latitude: number,
  longitude: number
): Promise<{
  city?: string;
  country?: string;
  formattedAddress: string;
}> => {
  try {
    const response = await axios.get(GEOCODING_URL, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      throw new Error('Konum bilgisi alınamadı');
    }

    const result = response.data.results[0];
    const components = result.address_components;

    let city: string | undefined;
    let country: string | undefined;

    components.forEach((component: any) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1') && !city) {
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.short_name;
      }
    });

    return {
      city,
      country,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    logger.error('Location metadata error:', error);
    throw error;
  }
};
