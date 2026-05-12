/**
 * routingService.ts
 * Driving directions via the public OSRM routing server.
 * Uses OpenStreetMap data — completely free, no API key required.
 *
 * ❌ No Google Maps
 * ❌ No Mapbox
 * ✅ OSRM only: https://router.project-osrm.org
 */

export interface RouteResult {
    /** GeoJSON LineString geometry – pass directly to Leaflet polyline */
    geojson: GeoJSON.LineString;
    /** Straight-line distance between the two points in km */
    distanceKm: number;
    /** Estimated driving duration in minutes */
    durationMin: number;
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch a driving route between two coordinates using the public OSRM API.
 *
 * @param startLat  Customer's current latitude
 * @param startLng  Customer's current longitude
 * @param endLat    Owner pickup latitude
 * @param endLng    Owner pickup longitude
 * @throws Error if the network request fails or OSRM returns no route
 */
export const getRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
): Promise<RouteResult> => {
    const url =
        `${OSRM_BASE}/${startLng},${startLat};${endLng},${endLat}` +
        `?overview=full&geometries=geojson`;

    console.log('🗺️ [ROUTING] Fetching route from OSRM:', url);

    let response: Response;
    try {
        response = await fetch(url);
    } catch (networkError) {
        console.error('❌ [ROUTING] Network error contacting OSRM:', networkError);
        throw new Error('Unable to load directions. Please try again.');
    }

    if (!response.ok) {
        console.error('❌ [ROUTING] OSRM returned non-OK status:', response.status);
        throw new Error('Unable to load directions. Please try again.');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        console.warn('⚠️ [ROUTING] OSRM returned no routes:', data);
        throw new Error('Unable to load directions. Please try again.');
    }

    const route = data.routes[0];
    const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
    const durationMin = Math.ceil(route.duration / 60);

    console.log(
        `✅ [ROUTING] Route found: ${distanceKm} km, ~${durationMin} min`
    );

    return {
        geojson: route.geometry as GeoJSON.LineString,
        distanceKm,
        durationMin,
    };
};
