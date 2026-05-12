import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { VerifiedCustomerLocation } from '../../types';
import { MapPin, CheckCircle, Navigation, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { calculateCustomerToProductDistance } from '../../services/customerLocation';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CustomerLocationDisplayLeafletProps {
  customerLocation: VerifiedCustomerLocation;
  productLat?: number;
  productLng?: number;
  productAddress?: string;
}

export const CustomerLocationDisplayLeaflet: React.FC<CustomerLocationDisplayLeafletProps> = ({
  customerLocation,
  productLat,
  productLng,
  productAddress,
}) => {
  // Calculate distance if product location available
  const distance = productLat && productLng
    ? calculateCustomerToProductDistance(
      customerLocation.lat,
      customerLocation.lng,
      productLat,
      productLng
    )
    : null;

  // Create custom icons for customer and product
  const customerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const productIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'product-marker'
  });

  // Calculate map center and bounds
  const mapCenter: [number, number] = productLat && productLng
    ? [(customerLocation.lat + productLat) / 2, (customerLocation.lng + productLng) / 2]
    : [customerLocation.lat, customerLocation.lng];

  const handleGetDirections = () => {
    // ✅ Opens OpenStreetMap directions — no Google Maps, no API key
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${customerLocation.lat}%2C${customerLocation.lng}%3B${productLat}%2C${productLng}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Customer's Verified Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trust Badge */}
        <Alert className="bg-green-100 border-green-300">
          <Info className="h-4 w-4 text-green-700" />
          <AlertDescription className="text-green-800">
            This customer has verified their location for pickup. Distance calculations are based on their verified GPS coordinates.
          </AlertDescription>
        </Alert>

        {/* Location Details */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{customerLocation.displayAddress}</p>
              {customerLocation.locality && (
                <p className="text-sm text-gray-600">{customerLocation.locality}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                GPS: {customerLocation.lat.toFixed(5)}, {customerLocation.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {distance && (
            <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg">
              <Navigation className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-indigo-900">
                  Distance from your pickup location
                </p>
                <p className="text-lg font-bold text-indigo-600">{distance}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative h-64 rounded-lg overflow-hidden border border-green-200">
          <MapContainer
            center={mapCenter}
            zoom={productLat && productLng ? 13 : 15}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Customer Location Marker */}
            <Marker
              position={[customerLocation.lat, customerLocation.lng]}
              icon={customerIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-green-700">Customer Location</p>
                  <p className="text-sm text-gray-600">{customerLocation.displayAddress}</p>
                  {customerLocation.locality && (
                    <p className="text-xs text-gray-500">{customerLocation.locality}</p>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Product Location Marker (if available) */}
            {productLat && productLng && (
              <>
                <Marker
                  position={[productLat, productLng]}
                  icon={productIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold text-indigo-700">Your Pickup Location</p>
                      {productAddress && (
                        <p className="text-sm text-gray-600">{productAddress}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Line connecting the two locations */}
                <Polyline
                  positions={[
                    [customerLocation.lat, customerLocation.lng],
                    [productLat, productLng]
                  ]}
                  color="#4F46E5"
                  weight={3}
                  opacity={0.6}
                  dashArray="10, 10"
                />
              </>
            )}
          </MapContainer>

          {/* Distance badge overlay */}
          {distance && (
            <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg z-[1000]">
              <p className="text-sm font-semibold text-indigo-600">{distance}</p>
              <p className="text-xs text-gray-600">to pickup</p>
            </div>
          )}
        </div>

        {/* Get Directions Button */}
        {productLat && productLng && (
          <Button
            onClick={handleGetDirections}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Get Directions from Customer to Pickup
          </Button>
        )}

        {/* Verification Info */}
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Why this matters:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Customer has GPS-verified their location at booking time</li>
            <li>You can estimate travel time for pickup logistics</li>
            <li>Reduces no-show risk with location transparency</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};