import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ========================================
 * CONTEXT-AWARE LOCATION GUARD SYSTEM
 * ========================================
 * 
 * This system ensures location is requested ONLY when needed for rental services,
 * preventing unnecessary interruptions during normal browsing.
 * 
 * ✅ NO AUTOMATIC POPUPS ON:
 * - Account creation/signup
 * - Login
 * - General browsing/navigation
 * - Dashboard access
 * - Profile viewing
 * 
 * ✅ LOCATION POPUP TRIGGERED ONLY WHEN:
 * - User clicks "Rent Now" / "Book Now"
 * - User attempts to proceed to booking/checkout
 * - AND location_setup_completed = false (user.verifiedLocation not set)
 * 
 * ✅ POST-SELECTION FLOW:
 * - Location is saved to user.verifiedLocation
 * - Flag location_setup_completed = true (implicit via verifiedLocation check)
 * - User can proceed with rental flow seamlessly
 * 
 * ✅ OPTIONAL USER-CONTROLLED LOCATION UPDATE:
 * - Available in Navbar → User Menu → "Change Location"
 * - Available in profile settings
 * - Only shown when user explicitly requests it
 * 
 * ✅ BACKEND ENFORCEMENT:
 * - Rental operations require verified location
 * - Normal browsing does NOT require location validation
 * 
 * IMPLEMENTATION:
 * - useLocationGuard: Hook to check location status
 * - LocationGuardWrapper: Component wrapper for rental actions
 * - Navbar: Optional location display + change button
 * 
 * USAGE EXAMPLE:
 * ```tsx
 * <LocationGuardWrapper actionName="Book Now">
 *   {({ checkLocationAndProceed }) => (
 *     <Button onClick={async () => {
 *       const hasLocation = await checkLocationAndProceed();
 *       if (hasLocation) {
 *         // Proceed with booking
 *       }
 *     }}>
 *       Book Now
 *     </Button>
 *   )}
 * </LocationGuardWrapper>
 * ```
 */
export const useLocationGuard = () => {
  const { user } = useAuth();

  /**
   * Check if location is already set up for customer
   * Returns true if location setup is complete
   */
  const isLocationSetupComplete = useCallback((): boolean => {
    if (!user || user.role !== 'customer') {
      console.log('🛡️ [LOCATION GUARD] Not a customer user, skipping location check');
      return true; // Non-customers don't need location
    }

    const hasLocation = !!user.verifiedLocation;
    
    console.log('🛡️ [LOCATION GUARD] Location setup status:', {
      userId: user.id,
      userName: user.name,
      hasVerifiedLocation: hasLocation,
      location: hasLocation ? {
        locality: user.verifiedLocation?.locality,
        city: user.verifiedLocation?.city,
        verifiedAt: user.verifiedLocation?.verifiedAt
      } : null,
      timestamp: new Date().toISOString()
    });

    return hasLocation;
  }, [user]);

  /**
   * Check if location setup is required before rental action
   * Returns true if location modal should be shown
   */
  const requiresLocationSetup = useCallback((): boolean => {
    if (!user || user.role !== 'customer') {
      return false; // Non-customers don't need location
    }

    const needsLocation = !user.verifiedLocation;

    if (needsLocation) {
      console.log('⚠️ [LOCATION GUARD] Location setup required before rental action:', {
        userId: user.id,
        userName: user.name,
        action: 'rental_initiated',
        reason: 'location_not_set',
        timestamp: new Date().toISOString()
      });
    }

    return needsLocation;
  }, [user]);

  /**
   * Get current customer location
   */
  const getCurrentLocation = useCallback(() => {
    if (!user || user.role !== 'customer') {
      return null;
    }
    return user.verifiedLocation || null;
  }, [user]);

  return {
    isLocationSetupComplete,
    requiresLocationSetup,
    getCurrentLocation,
    user
  };
};