import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { VerifiedCustomerLocation } from '../../types';
import { chennaiLocalities } from '../../data/mockData';

interface ManualLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationConfirmed: (location: VerifiedCustomerLocation) => void;
  currentLocation?: VerifiedCustomerLocation | null;
}

/**
 * Manual Location Picker - Works WITHOUT Google Maps
 * Fallback when Google Maps billing is not enabled
 */
export const ManualLocationPicker: React.FC<ManualLocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationConfirmed,
  currentLocation,
}) => {
  const [selectedLocality, setSelectedLocality] = useState<string>(
    currentLocation?.locality || ''
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    if (!selectedLocality) return;

    setIsConfirming(true);

    // Find the locality data
    const localityData = chennaiLocalities.find(l => l.name === selectedLocality);
    
    if (localityData) {
      const verifiedLocation: VerifiedCustomerLocation = {
        lat: localityData.lat,
        lng: localityData.lng,
        locality: localityData.name,
        area: localityData.area,
        city: 'Chennai',
        state: 'Tamil Nadu',
        displayAddress: `${localityData.name}, ${localityData.area}, Chennai, Tamil Nadu`,
        verifiedAt: new Date(),
        captureMethod: 'manual',
      };

      onLocationConfirmed(verifiedLocation);
      onClose();
    }

    setIsConfirming(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Your Location</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose your Chennai locality
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
        <div className="p-6 space-y-4">
          {/* Google Maps Setup Notice */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 text-sm">
              <strong>Google Maps not configured.</strong> Using manual location selection.
              See <code className="bg-amber-100 px-1 rounded text-xs">GOOGLE_MAPS_FIX.md</code> to enable maps.
            </AlertDescription>
          </Alert>

          {/* Locality Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Your Locality *
            </label>
            <Select value={selectedLocality} onValueChange={setSelectedLocality}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose your area in Chennai..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {chennaiLocalities.map((locality) => (
                  <SelectItem key={locality.name} value={locality.name}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{locality.name}</span>
                      <span className="text-xs text-gray-500">{locality.area}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Location Preview */}
          {selectedLocality && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">Selected Location</h4>
                  <p className="text-sm text-gray-700">
                    {selectedLocality}, {chennaiLocalities.find(l => l.name === selectedLocality)?.area}, Chennai
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Notice */}
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              This location will be used to show you nearby rental shops.
              You can change it anytime from your profile.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocality || isConfirming}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isConfirming ? 'Confirming...' : 'Confirm Location'}
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
