import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin, Navigation, Loader2, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { VerifiedCustomerLocation } from '../../types';
import { getCurrentLocation, getLocalityFromCoords, validateChennaiCoordinates } from '../../services/maps';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CustomerLeafletLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationConfirmed: (location: VerifiedCustomerLocation) => void;
  currentLocation?: VerifiedCustomerLocation | null;
}

// Component to handle map click events
function LocationMarker({ position, setPosition }: { 
  position: [number, number]; 
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export const CustomerLeafletLocationModal: React.FC<CustomerLeafletLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationConfirmed,
  currentLocation,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [position, setPosition] = useState<[number, number]>([13.0827, 80.2707]); // Default Chennai center
  const [isConfirming, setIsConfirming] = useState(false);
  const [resolvedLocality, setResolvedLocality] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low' | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Initialize position from current location or get GPS location
  useEffect(() => {
    if (isOpen && !currentLocation) {
      handleGetCurrentLocation();
    } else if (currentLocation) {
      setPosition([currentLocation.lat, currentLocation.lng]);
      setResolvedLocality(currentLocation.locality);
      setConfidence('high'); // Assume existing locations are high confidence
      setResolutionError(null);
    }
  }, [isOpen, currentLocation]);

  // Resolve locality whenever position changes - STRICT MODE
  useEffect(() => {
    const resolveLocality = async () => {
      setIsResolvingAddress(true);
      setResolutionError(null);
      
      console.log('🎯 [COORDINATE CAPTURE] Marker position changed:', {
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
        setConfidence(result.confidence);
        setResolutionError(null);
        
        console.log('✅ [FINAL RESOLUTION] Locality confirmed:', {
          locality: result.locality,
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

    if (isOpen) {
      resolveLocality();
    }
  }, [position, isOpen]);

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setPosition([location.lat, location.lng]);
      toast.success('Location detected!');
    } catch (error) {
      toast.error('Could not get your location. Please click on the map to set your location.');
      console.error('Location error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirmLocation = async () => {
    // VALIDATION GATE: Do not allow confirmation if resolution failed
    if (!resolvedLocality || resolutionError) {
      toast.error('Cannot confirm location. Please select a different point on the map.');
      return;
    }

    setIsConfirming(true);

    try {
      console.log('📍 [CONFIRMATION] Saving location to database:', {
        coordinates: { lat: position[0], lng: position[1] },
        resolvedLocality,
        confidence,
        timestamp: new Date().toISOString()
      });
      
      // STRICT RULE: Only store what was resolved from coordinates
      // Do NOT merge with old data or use defaults
      const verifiedLocation: VerifiedCustomerLocation = {
        lat: position[0],
        lng: position[1],
        locality: resolvedLocality, // Direct from reverse geocoding
        area: 'Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        displayAddress: `${resolvedLocality}, Chennai, Tamil Nadu`,
        verifiedAt: new Date(),
        captureMethod: 'gps',
      };

      console.log('💾 [DATABASE WRITE] Final location object:', verifiedLocation);

      onLocationConfirmed(verifiedLocation);
      toast.success(`✓ Location confirmed: ${resolvedLocality}, Chennai`, {
        duration: 3000,
      });
      onClose();
    } catch (error) {
      console.error('❌ [CONFIRMATION ERROR]:', error);
      toast.error('Failed to confirm location. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Verify Your Location</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on the map to adjust your exact location
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Why we need your location:</strong> We'll show you rental items available in your area and calculate accurate distances.
            </AlertDescription>
          </Alert>

          {/* Get Current Location Button */}
          <Button
            onClick={handleGetCurrentLocation}
            disabled={isLoadingLocation}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting your location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Use My Current Location
              </>
            )}
          </Button>

          {/* Map */}
          <div className="relative h-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
            <MapContainer
              center={position}
              zoom={15}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            
            {/* Instructions overlay - positioned OUTSIDE MapContainer */}
            <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg z-[1000] pointer-events-none">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Click on the map to adjust marker position
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Detected area: {isResolvingAddress ? (
                      <span className="text-gray-500 italic">Resolving...</span>
                    ) : (
                      <span className="font-semibold text-indigo-600">
                        {resolvedLocality}, Chennai
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Details */}
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
                  <h4 className="font-semibold text-gray-900 mb-1">Your Location</h4>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          confidence === 'high' ? 'bg-green-100 text-green-800' :
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
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <Alert className="bg-gray-50 border-gray-200">
            <Info className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700 text-xs">
              Your location is only used to show nearby rentals and calculate distances. 
              It's stored securely and never shared with third parties.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleConfirmLocation}
              disabled={isConfirming || !resolvedLocality || !!resolutionError || isResolvingAddress}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Location
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};