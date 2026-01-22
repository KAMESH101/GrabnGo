/**
 * Customer Location Service
 * Backend-controlled location verification and reverse geocoding
 * Ensures trustable, system-verified location data for customers
 */

import { calculateDistance } from './maps';

interface ReverseGeocodeResult {
  isValid: boolean;
  locality: string;
  area: string;
  city: string;
  state: string;
  displayAddress: string;
  error?: string;
}

/**
 * Chennai boundary coordinates for validation
 */
const CHENNAI_BOUNDS = {
  north: 13.2136,
  south: 12.8342,
  east: 80.3464,
  west: 80.1229,
};

const CHENNAI_CENTER = { lat: 13.0827, lng: 80.2707 };
const MAX_DISTANCE_FROM_CENTER_KM = 50; // Maximum allowed distance from Chennai center

/**
 * Backend reverse geocoding simulation
 * In production, this would call Google Geocoding API on the backend
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns Verified location data or validation error
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 1: Validate coordinates are within Chennai region
  const validationResult = validateCoordinates(lat, lng);
  if (!validationResult.isValid) {
    return {
      isValid: false,
      locality: '',
      area: '',
      city: '',
      state: '',
      displayAddress: '',
      error: validationResult.error,
    };
  }

  // Step 2: Backend reverse geocoding (DEMO MODE)
  // In production, this would be:
  /*
  const response = await fetch('/api/location/reverse-geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  });
  const data = await response.json();
  return data;
  */

  // DEMO IMPLEMENTATION: System-derives locality from coordinates
  const locationData = deriveLocalityFromCoordinates(lat, lng);

  console.log('[BACKEND SIMULATION] Reverse Geocoding:', {
    input: { lat, lng },
    output: locationData,
    note: 'In production, this would use Google Geocoding API on backend',
  });

  return {
    isValid: true,
    ...locationData,
  };
};

/**
 * Validate coordinates are within acceptable Chennai region
 * Backend validation ensures coordinate accuracy
 */
const validateCoordinates = (
  lat: number,
  lng: number
): { isValid: boolean; error?: string } => {
  // Check basic coordinate validity
  if (isNaN(lat) || isNaN(lng)) {
    return {
      isValid: false,
      error: 'Invalid coordinates provided',
    };
  }

  // Check if within Chennai bounds
  const withinBounds =
    lat >= CHENNAI_BOUNDS.south &&
    lat <= CHENNAI_BOUNDS.north &&
    lng >= CHENNAI_BOUNDS.west &&
    lng <= CHENNAI_BOUNDS.east;

  if (!withinBounds) {
    return {
      isValid: false,
      error: 'Location is outside Chennai service area. Please select a location within Chennai.',
    };
  }

  // Check distance from Chennai center
  const distance = calculateDistance(
    CHENNAI_CENTER.lat,
    CHENNAI_CENTER.lng,
    lat,
    lng
  );

  if (distance > MAX_DISTANCE_FROM_CENTER_KM) {
    return {
      isValid: false,
      error: `Location is too far from Chennai (${distance.toFixed(1)}km). Service area limited to ${MAX_DISTANCE_FROM_CENTER_KM}km radius.`,
    };
  }

  return { isValid: true };
};

/**
 * System-derives locality information from coordinates
 * This simulates backend reverse geocoding using coordinate-based logic
 */
const deriveLocalityFromCoordinates = (
  lat: number,
  lng: number
): {
  locality: string;
  area: string;
  city: string;
  state: string;
  displayAddress: string;
} => {
  // Define Chennai localities with their approximate boundaries
  const chennaiLocalities: {
    [key: string]: {
      center: { lat: number; lng: number };
      area: string;
      displayName: string;
    };
  } = {
    'T Nagar': {
      center: { lat: 13.0418, lng: 80.2341 },
      area: 'Central Chennai',
      displayName: 'T Nagar',
    },
    'Anna Nagar': {
      center: { lat: 13.085, lng: 80.2101 },
      area: 'North Chennai',
      displayName: 'Anna Nagar',
    },
    Adyar: {
      center: { lat: 13.0067, lng: 80.2206 },
      area: 'South Chennai',
      displayName: 'Adyar',
    },
    Velachery: {
      center: { lat: 12.975, lng: 80.2179 },
      area: 'South Chennai',
      displayName: 'Velachery',
    },
    Porur: {
      center: { lat: 13.0358, lng: 80.1558 },
      area: 'West Chennai',
      displayName: 'Porur',
    },
    'OMR (Sholinganallur)': {
      center: { lat: 12.901, lng: 80.2279 },
      area: 'IT Corridor',
      displayName: 'Sholinganallur (OMR)',
    },
    Tambaram: {
      center: { lat: 12.9249, lng: 80.1 },
      area: 'South Chennai',
      displayName: 'Tambaram',
    },
    Chromepet: {
      center: { lat: 12.9516, lng: 80.1462 },
      area: 'South Chennai',
      displayName: 'Chromepet',
    },
    'Mylapore': {
      center: { lat: 13.0339, lng: 80.2619 },
      area: 'Central Chennai',
      displayName: 'Mylapore',
    },
    'Nungambakkam': {
      center: { lat: 13.0569, lng: 80.2426 },
      area: 'Central Chennai',
      displayName: 'Nungambakkam',
    },
  };

  // Find closest locality based on distance
  let closestLocality = 'T Nagar'; // Default
  let minDistance = Infinity;
  let matchedData = chennaiLocalities['T Nagar'];

  for (const [localityName, data] of Object.entries(chennaiLocalities)) {
    const distance = calculateDistance(
      lat,
      lng,
      data.center.lat,
      data.center.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestLocality = localityName;
      matchedData = data;
    }
  }

  // Generate display address
  const displayAddress = `${matchedData.displayName}, ${matchedData.area}, Chennai, Tamil Nadu`;

  return {
    locality: closestLocality,
    area: matchedData.area,
    city: 'Chennai',
    state: 'Tamil Nadu',
    displayAddress,
  };
};

/**
 * Calculate distance between customer and product locations
 * Used for proximity-based search and display
 */
export const calculateCustomerToProductDistance = (
  customerLat: number,
  customerLng: number,
  productLat: number,
  productLng: number
): number => {
  return calculateDistance(customerLat, customerLng, productLat, productLng);
};

/**
 * Format verified location for display to owners
 * Returns trust-building display string
 */
export const formatVerifiedLocationForOwner = (location: {
  locality: string;
  area: string;
  city: string;
  verifiedAt: Date;
  captureMethod: 'gps' | 'manual';
}): string => {
  const method = location.captureMethod === 'gps' ? 'GPS' : 'Map Selection';
  const timestamp = new Date(location.verifiedAt).toLocaleString('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return `${location.locality}, ${location.area} (System-verified via ${method} at ${timestamp})`;
};
