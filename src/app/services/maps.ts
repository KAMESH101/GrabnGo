// Maps service - utility functions for geocoding and location operations

/**
 * Geocode an address to get coordinates
 * This converts the full pickup address into accurate geographic coordinates
 */
export const geocodeAddress = async (address: string, locality?: string): Promise<{ lat: number; lng: number } | null> => {
  // Simulate API call delay for demo
  await new Promise(resolve => setTimeout(resolve, 800));

  // DEMO MODE: In production, this would use a geocoding API
  // Production implementation would use OpenStreetMap Nominatim or similar service
  
  // DEMO IMPLEMENTATION: Simulates address-based geocoding
  // Generate coordinates based on address hash (consistent for same address)
  const addressHash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base coordinates for Chennai localities
  const localityCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'T Nagar': { lat: 13.0418, lng: 80.2341 },
    'Anna Nagar': { lat: 13.0850, lng: 80.2101 },
    'Adyar': { lat: 13.0067, lng: 80.2206 },
    'Velachery': { lat: 12.9750, lng: 80.2179 },
    'Porur': { lat: 13.0358, lng: 80.1558 },
    'OMR (Sholinganallur)': { lat: 12.9010, lng: 80.2279 },
    'Tambaram': { lat: 12.9249, lng: 80.1000 },
    'Chromepet': { lat: 12.9516, lng: 80.1462 },
  };

  if (locality && localityCoordinates[locality]) {
    const baseCoords = localityCoordinates[locality];
    
    // Use address hash to generate consistent coordinates for the same address
    // This simulates accurate geocoding where same address always gets same coordinates
    const seed = addressHash % 1000;
    const latOffset = ((seed % 50) - 25) * 0.0002; // ±50-500m variation
    const lngOffset = ((seed % 73) - 36) * 0.0002;
    
    const coords = {
      lat: baseCoords.lat + latOffset,
      lng: baseCoords.lng + lngOffset,
    };
    
    console.log('[DEMO MODE] Geocoded address:', {
      address,
      locality,
      coordinates: coords,
      note: 'Using simulated address-based geocoding'
    });
    
    return coords;
  }

  // No locality provided or locality not recognized - return null silently
  // The calling code should handle this case appropriately
  return null;
};

/**
 * Validate if an address is complete and valid
 */
export const validateAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: 'Address is required' };
  }

  if (address.trim().length < 10) {
    return { isValid: false, error: 'Please enter a complete address (minimum 10 characters)' };
  }

  // Check for common address components
  const hasNumber = /\d/.test(address);
  if (!hasNumber) {
    return { isValid: false, error: 'Address should include street number or building number' };
  }

  return { isValid: true };
};

/**
 * Get directions URL (opens in external map app)
 */
export const getDirectionsUrl = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string => {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
};

/**
 * Get current location (with user permission)
 */
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.info('ℹ️ Geolocation not supported. Using Chennai city center.');
      resolve({
        lat: 13.0827,
        lng: 80.2707,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✓ Location access granted');
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Handle different geolocation error codes
        let message = 'Unable to access location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access not granted';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        
        console.info(`ℹ️ ${message}. Using Chennai city center as default.`);
        
        // Default to Chennai city center - this is expected behavior
        resolve({
          lat: 13.0827,
          lng: 80.2707,
        });
      },
      {
        timeout: 10000, // 10 second timeout
        maximumAge: 60000, // Accept cached position up to 1 minute old
        enableHighAccuracy: false, // Faster response, less battery drain
      }
    );
  });
};

/**
 * Calculate distance between two points (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm}km away`;
};

/**
 * Get locality name from coordinates (reverse geocoding)
 * STRICT MODE: Uses OpenStreetMap Nominatim API with NO FALLBACK
 * Returns null if reverse geocoding fails - caller must handle errors
 */
export const getLocalityFromCoords = async (
  lat: number, 
  lng: number
): Promise<{ locality: string; confidence: 'high' | 'medium' | 'low'; rawData: any } | null> => {
  console.log('🔍 [REVERSE GEOCODING] Starting strict coordinate resolution:', { 
    lat, 
    lng,
    timestamp: new Date().toISOString() 
  });
  
  try {
    // Use OpenStreetMap Nominatim API for reverse geocoding
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    console.log('📡 [API CALL] Nominatim request:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GrabNGo-Chennai-Rental-App'
      }
    });

    if (!response.ok) {
      console.error('❌ [API ERROR] Nominatim API failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('📦 [RAW RESPONSE] Nominatim data:', JSON.stringify(data, null, 2));

    // Validate response structure
    if (!data || !data.address) {
      console.error('❌ [VALIDATION ERROR] Invalid API response structure:', data);
      return null;
    }

    const address = data.address;
    
    // STRICT PRIORITY ORDER for locality extraction
    // Do NOT fall back to city-level if locality fields exist
    const localityFields = [
      { field: 'suburb', confidence: 'high' as const },
      { field: 'neighbourhood', confidence: 'high' as const },
      { field: 'quarter', confidence: 'medium' as const },
      { field: 'city_district', confidence: 'medium' as const },
      { field: 'locality', confidence: 'low' as const },
    ];

    for (const { field, confidence } of localityFields) {
      if (address[field]) {
        const locality = address[field];
        
        console.log('✅ [RESOLUTION SUCCESS] Locality extracted:', {
          locality,
          field,
          confidence,
          coordinates: { lat, lng },
          fullAddress: data.display_name
        });

        // Spatial validation: verify locality is in Chennai or Chennai metro area
        const city = address.city || address.town || address.village || '';
        const district = address.state_district || address.county || '';
        const state = address.state || '';
        const fullAddress = data.display_name.toLowerCase();
        
        // Chennai metro area includes: Chennai city + Chengalpattu district suburbs
        const isChennaiMetro = 
          city.toLowerCase().includes('chennai') ||
          fullAddress.includes('chennai') ||
          fullAddress.includes('tamil nadu') && (
            district.toLowerCase().includes('chengalpattu') ||
            district.toLowerCase().includes('tiruvallur') ||
            district.toLowerCase().includes('kanchipuram')
          );

        if (!isChennaiMetro) {
          console.warn('⚠️ [SPATIAL VALIDATION WARNING] Location may be outside Chennai metro area:', {
            locality,
            city,
            district,
            state,
            displayName: data.display_name
          });
        } else {
          console.log('✅ [SPATIAL VALIDATION] Location confirmed in Chennai metro area:', {
            locality,
            city: city || district,
            displayName: data.display_name
          });
        }

        return {
          locality,
          confidence,
          rawData: data
        };
      }
    }

    // NO FALLBACK: If no locality field found, return null
    console.error('❌ [RESOLUTION FAILED] No locality fields found in response:', {
      availableFields: Object.keys(address),
      coordinates: { lat, lng }
    });
    
    return null;

  } catch (error) {
    console.error('❌ [EXCEPTION] Reverse geocoding failed:', error);
    return null;
  }
};

/**
 * Validate if coordinates are within Chennai metropolitan area
 * Prevents accepting locations outside service area
 */
export const validateChennaiCoordinates = (lat: number, lng: number): boolean => {
  // Chennai bounding box (approximate)
  const CHENNAI_BOUNDS = {
    north: 13.2500,
    south: 12.7500,
    east: 80.3500,
    west: 79.9500
  };

  const isInBounds = 
    lat >= CHENNAI_BOUNDS.south &&
    lat <= CHENNAI_BOUNDS.north &&
    lng >= CHENNAI_BOUNDS.west &&
    lng <= CHENNAI_BOUNDS.east;

  console.log('🗺️ [BOUNDS CHECK] Coordinate validation:', {
    coordinates: { lat, lng },
    isInChennai: isInBounds,
    bounds: CHENNAI_BOUNDS
  });

  return isInBounds;
};