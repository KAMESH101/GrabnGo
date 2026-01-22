import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapProps {
  lat: number;
  lng: number;
  title?: string;
  showDistance?: boolean;
  userDistance?: string;
  onGetDirections?: () => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  lat,
  lng,
  title = 'Pickup Location',
  showDistance = false,
  userDistance,
  onGetDirections,
}) => {
  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">{title}</p>
              {showDistance && userDistance && (
                <p className="text-sm text-gray-600">{userDistance} from you</p>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Distance info overlay */}
      {showDistance && userDistance && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          <p className="font-semibold text-indigo-600">{userDistance}</p>
          <p className="text-gray-600 text-xs">from your location</p>
        </div>
      )}

      {/* Get Directions Button */}
      {onGetDirections && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <button
            onClick={onGetDirections}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
          >
            Get Directions
          </button>
        </div>
      )}
    </div>
  );
};