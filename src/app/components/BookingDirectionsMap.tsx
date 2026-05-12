/**
 * BookingDirectionsMap.tsx
 *
 * Shows a Leaflet/OpenStreetMap directions map from the customer's live
 * location to the product pickup point.
 *
 * SECURITY: The map is only rendered when booking.status === "confirmed".
 * Owner coordinates are never rendered, logged, or passed to any external
 * service before that condition is met.
 *
 * Map stack — strictly:
 *   • Leaflet (react-leaflet)
 *   • OpenStreetMap tile layer
 *   • OSRM public routing API
 * ❌ No Google Maps   ❌ No Mapbox   ❌ No paid API
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Booking } from '../types';
import { getRoute, RouteResult } from '../services/routingService';
import { MapPin, Navigation, AlertTriangle, Loader2, Lock, ExternalLink, RefreshCw } from 'lucide-react';

// ─── Fix Leaflet's default icon paths (Vite asset bundling quirk) ─────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom coloured marker factories ─────────────────────────────────────────
const makeIcon = (color: 'blue' | 'red') => {
    const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="${color === 'blue' ? '#3B82F6' : '#EF4444'}"
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"/>
      <circle fill="white" cx="12" cy="12" r="5"/>
    </svg>`);

    return L.divIcon({
        html: `<img src="data:image/svg+xml,${svg}" style="width:24px;height:36px;"/>`,
        className: '',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -36],
    });
};

const blueIcon = makeIcon('blue');
const redIcon = makeIcon('red');

// ─── Helper: auto-fit map bounds when route is ready ─────────────────────────
interface FitBoundsProps {
    customerLat: number;
    customerLng: number;
    ownerLat: number;
    ownerLng: number;
}
const FitBounds: React.FC<FitBoundsProps> = ({ customerLat, customerLng, ownerLat, ownerLng }) => {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLngBounds(
            [customerLat, customerLng],
            [ownerLat, ownerLng]
        );
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [map, customerLat, customerLng, ownerLat, ownerLng]);
    return null;
};

// ─── Main Props ───────────────────────────────────────────────────────────────
interface BookingDirectionsMapProps {
    booking: Booking;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const BookingDirectionsMap: React.FC<BookingDirectionsMapProps> = ({ booking }) => {

    // ── 1. Access gate ────────────────────────────────────────────────────────
    if (booking.status !== 'confirmed') {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-amber-800">Directions Locked</p>
                    <p className="text-sm text-amber-700 mt-1">
                        Directions will be available once the owner confirms your booking.
                    </p>
                </div>
            </div>
        );
    }

    // Pickup coords must be stored on the booking
    const ownerLat = booking.pickupLat;
    const ownerLng = booking.pickupLng;

    if (!ownerLat || !ownerLng) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-gray-500 text-sm">
                Pickup location coordinates are not available for this booking.
            </div>
        );
    }

    return <DirectionsMapInner ownerLat={ownerLat} ownerLng={ownerLng} booking={booking} />;
};

// ─── Inner component (only rendered after status check passes) ────────────────
interface InnerProps {
    ownerLat: number;
    ownerLng: number;
    booking: Booking;
}

const DirectionsMapInner: React.FC<InnerProps> = ({ ownerLat, ownerLng, booking }) => {
    const [customerPos, setCustomerPos] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [geoLoading, setGeoLoading] = useState(true);
    const [route, setRoute] = useState<RouteResult | null>(null);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const routeFetchedRef = useRef(false);
    // Incrementing this triggers a fresh geolocation attempt
    const [geoRetryCount, setGeoRetryCount] = useState(0);

    const handleRetry = () => {
        setGeoError(null);
        setGeoLoading(true);
        setRoute(null);
        setRouteError(null);
        routeFetchedRef.current = false;
        setGeoRetryCount(c => c + 1);
    };

    // ── 2. Get customer position ───────────────────────────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            setGeoLoading(false);
            return;
        }

        // Low-accuracy first: much faster on desktop/browser (no GPS chip wait)
        // High-accuracy can take 10–30s on desktop and causes TIMEOUT errors.
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCustomerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoLoading(false);
            },
            (err) => {
                console.warn('⚠️ [DIRECTIONS] Geolocation error:', err.code, err.message);
                // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
                if (err.code === 1) {
                    setGeoError(
                        'Location permission was denied. Please click the lock icon in your browser address bar and allow location access, then retry.'
                    );
                } else if (err.code === 3) {
                    setGeoError(
                        'Location request timed out. This can happen on desktop browsers. Please retry or check your browser\'s location settings.'
                    );
                } else {
                    // POSITION_UNAVAILABLE (2) or any other error
                    setGeoError(
                        'Unable to determine your current location. Please check your device\'s location settings and retry.'
                    );
                }
                setGeoLoading(false);
            },
            // enableHighAccuracy: false → uses network/IP location, responds in <1s on most browsers
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
        );
    }, [geoRetryCount]); // re-runs on each retry

    // ── 3. Fetch route once customer position is known ─────────────────────────
    useEffect(() => {
        if (!customerPos || routeFetchedRef.current) return;
        routeFetchedRef.current = true;

        const fetchRoute = async () => {
            setRouteLoading(true);
            try {
                const result = await getRoute(
                    customerPos.lat, customerPos.lng,
                    ownerLat, ownerLng
                );
                setRoute(result);
            } catch (err: any) {
                console.error('❌ [DIRECTIONS] Route fetch failed:', err);
                setRouteError(err.message || 'Unable to load directions. Please try again.');
            } finally {
                setRouteLoading(false);
            }
        };

        fetchRoute();
    }, [customerPos, ownerLat, ownerLng]);

    // ── 4. Loading state ───────────────────────────────────────────────────────
    if (geoLoading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 flex items-center justify-center gap-3 min-h-[120px]">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-gray-600 text-sm">Getting your location…</span>
            </div>
        );
    }

    // ── 5. Geolocation error ───────────────────────────────────────────────────
    if (geoError) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-semibold text-red-800">Location Access Issue</p>
                    <p className="text-sm text-red-700 mt-1">{geoError}</p>
                    <button
                        onClick={handleRetry}
                        className="mt-3 flex items-center gap-1.5 text-sm text-red-700 border border-red-300 bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // ── 6. Derive polyline coordinates from GeoJSON ────────────────────────────
    let polylinePositions: [number, number][] = [];
    if (route) {
        // GeoJSON coordinates are [lng, lat]; Leaflet needs [lat, lng]
        polylinePositions = (route.geojson.coordinates as [number, number][]).map(
            ([lng, lat]) => [lat, lng]
        );
    }

    const mapCenter: [number, number] = customerPos
        ? [customerPos.lat, customerPos.lng]
        : [ownerLat, ownerLng];

    // ✅ External link to OpenStreetMap directions — no Google Maps
    const osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${customerPos?.lat}%2C${customerPos?.lng}%3B${ownerLat}%2C${ownerLng}`;

    return (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">Directions to Pickup</h3>
            </div>

            {/* Route info strip */}
            {route && (
                <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-indigo-800 font-medium">
                        <MapPin className="w-4 h-4" />
                        {route.distanceKm} km
                    </span>
                    <span className="text-indigo-700">~{route.durationMin} min drive</span>
                    {booking.pickupAddress && (
                        <span className="text-gray-600 flex-1 truncate">{booking.pickupAddress}</span>
                    )}
                    <a
                        href={osmDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Open in OpenStreetMap <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}

            {/* Route loading / error overlay (shows above map placeholder) */}
            {routeLoading && (
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating route…
                </div>
            )}
            {routeError && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    {routeError}
                </div>
            )}

            {/* Leaflet Map — minimum 400px height as required */}
            <div style={{ height: '420px', width: '100%' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    {/* ✅ OpenStreetMap tiles only */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Customer marker — Blue */}
                    {customerPos && (
                        <Marker position={[customerPos.lat, customerPos.lng]} icon={blueIcon}>
                            <Popup>
                                <div className="text-center">
                                    <p className="font-semibold text-blue-700">📍 Your Location</p>
                                    <p className="text-xs text-gray-500 mt-1">Starting point</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Owner / Pickup marker — Red */}
                    <Marker position={[ownerLat, ownerLng]} icon={redIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-semibold text-red-700">📦 Pickup Location</p>
                                {booking.pickupAddress && (
                                    <p className="text-xs text-gray-500 mt-1">{booking.pickupAddress}</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>

                    {/* Route polyline */}
                    {polylinePositions.length > 0 && (
                        <Polyline
                            positions={polylinePositions}
                            pathOptions={{ color: '#4F46E5', weight: 4, opacity: 0.8 }}
                        />
                    )}

                    {/* Auto-fit bounds once both positions are known */}
                    {customerPos && (
                        <FitBounds
                            customerLat={customerPos.lat}
                            customerLng={customerPos.lng}
                            ownerLat={ownerLat}
                            ownerLng={ownerLng}
                        />
                    )}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                    Your location
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                    Pickup point
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-8 border-t-2 border-indigo-500"></span>
                    Route
                </span>
            </div>
        </div>
    );
};
