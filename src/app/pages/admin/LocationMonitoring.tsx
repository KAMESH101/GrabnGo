import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MapPin, User, Package } from 'lucide-react';
import { getAllUsers, getAllProducts } from '../../services/database';
import { User as UserType, Product } from '../../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ownerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const LocationMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    setUsers(getAllUsers());
    setProducts(getAllProducts());
  };

  // Get customer locations
  const customerLocations = users
    .filter(u => u.role === 'customer' && u.verifiedLocation)
    .map(u => ({
      ...u.verifiedLocation!,
      userName: u.name,
      userEmail: u.email,
      type: 'customer' as const,
    }));

  // Get owner/product pickup locations
  const pickupLocations = products.map(p => ({
    lat: p.pickupLat,
    lng: p.pickupLng,
    locality: p.pickupLocality,
    address: p.pickupAddress,
    productTitle: p.title,
    ownerName: p.ownerName,
    type: 'pickup' as const,
  }));

  const allLocations = [...customerLocations, ...pickupLocations];

  // Chennai center coordinates
  const chennaiCenter: [number, number] = [13.0827, 80.2707];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Location Monitoring</h1>
          <p className="text-gray-600 mt-1">Debug and verify stored pickup locations</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Customer Locations</p>
              </div>
              <p className="text-2xl font-bold mt-2">{customerLocations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Pickup Locations</p>
              </div>
              <p className="text-2xl font-bold mt-2">{pickupLocations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold mt-2">{allLocations.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Location Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={chennaiCenter}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Customer Location Markers */}
                {customerLocations.map((loc, idx) => (
                  <Marker
                    key={`customer-${idx}`}
                    position={[loc.lat, loc.lng]}
                    icon={customerIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <p className="font-medium text-blue-600">Customer Location</p>
                        </div>
                        <p className="font-medium">{loc.userName}</p>
                        <p className="text-sm text-gray-600">{loc.userEmail}</p>
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-medium">{loc.locality}</p>
                          <p className="text-sm text-gray-600">{loc.area}, {loc.city}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Verified: {new Date(loc.verifiedAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            Method: {loc.captureMethod}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Pickup Location Markers */}
                {pickupLocations.map((loc, idx) => (
                  <Marker
                    key={`pickup-${idx}`}
                    position={[loc.lat, loc.lng]}
                    icon={ownerIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-green-600" />
                          <p className="font-medium text-green-600">Pickup Location</p>
                        </div>
                        <p className="font-medium">{loc.productTitle}</p>
                        <p className="text-sm text-gray-600">Owner: {loc.ownerName}</p>
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-medium">{loc.locality}</p>
                          <p className="text-sm text-gray-600">{loc.address}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Lat: {loc.lat.toFixed(6)}, Lng: {loc.lng.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Location List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Customer Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Customer Locations ({customerLocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {customerLocations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No customer locations found
                  </p>
                ) : (
                  customerLocations.map((loc, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="font-medium text-sm">{loc.userName}</p>
                      <p className="text-xs text-gray-600 mt-1">{loc.locality}, {loc.area}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pickup Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Pickup Locations ({pickupLocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {pickupLocations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No pickup locations found
                  </p>
                ) : (
                  pickupLocations.map((loc, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="font-medium text-sm">{loc.productTitle}</p>
                      <p className="text-xs text-gray-600">by {loc.ownerName}</p>
                      <p className="text-xs text-gray-600 mt-1">{loc.locality}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
