import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getLocalityFromCoords, validateChennaiCoordinates } from '../../services/maps';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker with indigo color
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 1.996.471 3.882 1.305 5.547l10.39 21.008a1 1 0 0 0 1.61 0l10.39-21.008A12.423 12.423 0 0 0 25 12.5C25 5.596 19.404 0 12.5 0zm0 17.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="#4F46E5"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

interface LocationPickerProps {
  onLocationConfirmed: (lat: number, lng: number, locality: string, formattedAddress?: string) => void;
  initialLat?: number;
  initialLng?: number;
  address?: string;
}

// Component to handle map clicks and recenter
function LocationMarker({ position, setPosition }: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
    },
  });

  return position === null ? null : (
    <Marker
      position={position}
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPos = marker.getLatLng();
          setPosition([newPos.lat, newPos.lng]);
        },
      }}
    />
  );
}

// Component to handle flying to location
function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [position, map]);

  return null;
}

export const LeafletLocationPicker: React.FC<LocationPickerProps> = ({
  onLocationConfirmed,
  initialLat,
  initialLng,
  address,
}) => {
  // Chennai center as default
  const defaultCenter: [number, number] = [13.0827, 80.2707];

  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [captureMethod, setCaptureMethod] = useState<'gps' | 'manual' | null>(null);
  const [resolvedLocality, setResolvedLocality] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low' | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Resolve locality whenever position changes - STRICT MODE
  useEffect(() => {
    const resolveLocality = async () => {
      if (!position) return;

      setIsResolvingAddress(true);
      setResolutionError(null);

      console.log('🎯 [OWNER LISTING] Marker position changed:', {
        lat: position[0],
        lng: position[1],
        timestamp: new Date().toISOString()
      });

      // Step 1: Validate coordinates are within Chennai bounds
      const isInChennai = validateChennaiCoordinates(position[0], position[1]);
      if (!isInChennai) {
        console.error('❌ [BOUNDS VALIDATION] Coordinates outside Chennai metropolitan area');
        setResolutionError('Location is outside Chennai service area. Please select a location within Chennai.');
        setResolvedLocality(null);
        setConfidence(null);
        setIsResolvingAddress(false);
        return;
      }

      try {
        // Step 2: Perform reverse geocoding (STRICT - NO FALLBACK)
        const result = await getLocalityFromCoords(position[0], position[1]);

        if (!result) {
          console.error('❌ [RESOLUTION FAILED] Unable to resolve locality for coordinates');
          setResolutionError('Unable to determine locality. Please try a different location or check your internet connection.');
          setResolvedLocality(null);
          setConfidence(null);
          setIsResolvingAddress(false);
          return;
        }

        // Step 3: Store resolved data
        setResolvedLocality(result.locality);
        setResolvedAddress(result.formattedAddress || null);
        setConfidence(result.confidence);
        setResolutionError(null);

        console.log('✅ [FINAL RESOLUTION] Locality confirmed:', {
          locality: result.locality,
          formattedAddress: result.formattedAddress,
          streetAddress: result.streetAddress,
          buildingNumber: result.buildingNumber,
          confidence: result.confidence,
          coordinates: { lat: position[0], lng: position[1] },
          fullAddress: result.rawData.display_name
        });

      } catch (error) {
        console.error('❌ [EXCEPTION] Resolution process failed:', error);
        setResolutionError('Failed to resolve location. Please try again.');
        setResolvedLocality(null);
        setConfidence(null);
      } finally {
        setIsResolvingAddress(false);
      }
    };

    resolveLocality();
  }, [position]);

  const handleUseCurrentLocation = () => {
    setIsCapturing(true);
    setIsConfirmed(false);
    setCaptureMethod('gps');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          const newPos: [number, number] = [
            geoPosition.coords.latitude,
            geoPosition.coords.longitude,
          ];
          setPosition(newPos);
          toast.success('📍 GPS location captured successfully');
          setIsCapturing(false);
        },
        (error) => {
          let errorMessage = 'Unable to get your location. ';

          if (error.code === error.PERMISSION_DENIED) {
            errorMessage += 'Please grant location permission in your browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage += 'Location information is unavailable. Please select manually on the map.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage += 'Location request timed out. Please try again.';
          } else {
            errorMessage += 'Please select manually on the map.';
          }

          toast.error(errorMessage);
          setIsCapturing(false);
          setCaptureMethod(null);
        },
        {
          enableHighAccuracy: true, // Use GPS for precise location
          timeout: 15000, // 15 second timeout (GPS needs time for accurate lock)
          maximumAge: 0, // Always get fresh position, no cached data
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setIsCapturing(false);
      setCaptureMethod(null);
    }
  };

  const handleConfirmLocation = () => {
    if (position && resolvedLocality) {
      setIsConfirmed(true);
      onLocationConfirmed(position[0], position[1], resolvedLocality, resolvedAddress || undefined);
      toast.success('✓ Pickup location confirmed');
    }
  };

  const handleRecapture = () => {
    setIsConfirmed(false);
    setPosition(null);
    setCaptureMethod(null);
    setResolvedLocality(null);
    setResolvedAddress(null);
    setConfidence(null);
    setResolutionError(null);
  };

  return (
    <div className="space-y-4">
      {/* User Guidance */}
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Location Selection:</strong> Click the "Use Current GPS Location" button or click/drag the marker on the map to set your location.
          Confirm when ready.
        </AlertDescription>
      </Alert>

      {/* GPS Capture Button */}
      {!position && (
        <div>
          <Button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isCapturing}
            className="bg-indigo-600 hover:bg-indigo-700 w-full"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Capturing GPS Location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Use Current GPS Location
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Click to capture your current GPS location, or click on the map below to select manually.
          </p>
        </div>
      )}

      {/* Map Container */}
      <div className="border-2 border-indigo-200 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 15 : 13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          {position && <FlyToLocation position={position} />}
        </MapContainer>
      </div>

      {/* Location Info */}
      {position && (
        <div className="space-y-4">
          {/* Resolution Status or Error */}
          {resolutionError ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900 text-sm">
                <strong>Location Resolution Failed:</strong> {resolutionError}
              </AlertDescription>
            </Alert>
          ) : (
            <div className={`rounded-lg p-4 ${resolvedLocality ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-start gap-3">
                {resolvedLocality ? (
                  <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="bg-gray-400 rounded-full p-2 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Resolved Location</h4>
                  {isResolvingAddress ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <p className="text-sm text-gray-600 italic">Resolving address from coordinates...</p>
                    </div>
                  ) : resolvedLocality ? (
                    <>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>{resolvedLocality}</strong>, Chennai, Tamil Nadu
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${confidence === 'high' ? 'bg-green-100 text-green-800' :
                          confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                          {confidence?.toUpperCase()} CONFIDENCE
                        </span>
                      </div>
                      <Alert className="bg-yellow-50 border-yellow-200 mt-2">
                        <AlertDescription className="text-yellow-900 text-xs">
                          ⚠️ <strong>Verify this is correct:</strong> If the locality doesn't match your selected map point, click a different location.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Click on the map to select your location
                    </p>
                  )}
                  {captureMethod === 'gps' && resolvedLocality && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Captured via GPS
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Actions */}
          {!isConfirmed ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Review Required:</strong> Please verify the location shown on the map matches your actual pickup location.
                You must confirm before proceeding.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Location Confirmed:</strong> This location will be used for customer pickup directions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            {!isConfirmed ? (
              <>
                <Button
                  type="button"
                  onClick={handleConfirmLocation}
                  disabled={!resolvedLocality || !!resolutionError || isResolvingAddress}
                  className="bg-green-600 hover:bg-green-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm This Location
                </Button>
                <Button
                  type="button"
                  onClick={handleRecapture}
                  variant="outline"
                  className="flex-1"
                >
                  Re-select Location
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleRecapture}
                variant="outline"
                className="w-full"
              >
                Change Location
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Status Indicator */}
      {isConfirmed && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Pickup location confirmed and ready for submission</span>
        </div>
      )}
    </div>
  );
};