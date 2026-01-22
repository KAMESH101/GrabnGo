import React, { useState, useCallback } from 'react';
import { useLocationGuard } from '../../hooks/useLocationGuard';
import { useAuth } from '../../context/AuthContext';
import { CustomerLeafletLocationModal } from './CustomerLeafletLocationModal';
import { VerifiedCustomerLocation } from '../../types';
import { toast } from 'sonner';

interface LocationGuardWrapperProps {
  children: (props: { checkLocationAndProceed: () => Promise<boolean> }) => React.ReactNode;
  actionName?: string; // e.g., "Book Now", "Rent Now"
  requireLocation?: boolean; // Default true
}

/**
 * LocationGuardWrapper
 * 
 * Context-aware component that wraps rental actions and ensures
 * location is set ONLY when needed for actual rental services.
 * 
 * Usage:
 * <LocationGuardWrapper>
 *   {({ checkLocationAndProceed }) => (
 *     <Button onClick={async () => {
 *       const hasLocation = await checkLocationAndProceed();
 *       if (hasLocation) {
 *         // Proceed with rental action
 *       }
 *     }}>
 *       Book Now
 *     </Button>
 *   )}
 * </LocationGuardWrapper>
 */
export const LocationGuardWrapper: React.FC<LocationGuardWrapperProps> = ({
  children,
  actionName = 'rental action',
  requireLocation = true
}) => {
  const { requiresLocationSetup, isLocationSetupComplete, user } = useLocationGuard();
  const { updateCustomerLocation } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  /**
   * Check if location is set, show modal if needed
   * Returns true if location is ready (or not required)
   */
  const checkLocationAndProceed = useCallback(async (): Promise<boolean> => {
    console.log('🎯 [LOCATION GUARD WRAPPER] Rental action initiated:', {
      actionName,
      requireLocation,
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      timestamp: new Date().toISOString()
    });

    // Skip location check if not required
    if (!requireLocation) {
      console.log('✅ [LOCATION GUARD WRAPPER] Location not required for this action');
      return true;
    }

    // Skip for non-customer users
    if (!user || user.role !== 'customer') {
      console.log('✅ [LOCATION GUARD WRAPPER] Non-customer user, skipping location check');
      return true;
    }

    // Check if location is already set up
    if (isLocationSetupComplete()) {
      console.log('✅ [LOCATION GUARD WRAPPER] Location already set, proceeding with action');
      toast.success('📍 Using your verified location');
      return true;
    }

    // Location required but not set - show modal
    console.log('🚨 [LOCATION GUARD WRAPPER] Location required, showing modal');
    toast.info('📍 Please set your location to continue');
    setShowLocationModal(true);
    
    // Return false - action should not proceed yet
    return false;
  }, [requireLocation, user, isLocationSetupComplete, actionName]);

  /**
   * Handle location confirmation from modal
   */
  const handleLocationConfirmed = useCallback(async (location: VerifiedCustomerLocation) => {
    console.log('✅ [LOCATION GUARD WRAPPER] Location confirmed from modal:', {
      locality: location.locality,
      city: location.city,
      coordinates: { lat: location.lat, lng: location.lng },
      timestamp: new Date().toISOString()
    });
    
    // Save location to auth context
    await updateCustomerLocation(location);
    
    setShowLocationModal(false);
    
    // Location is now set, show success
    toast.success('✅ Location saved! You can now proceed with booking');
    
    // If there was a pending action, we don't auto-execute it
    // User should click the button again
    if (pendingAction) {
      toast.info('Please click "Book Now" again to continue');
      setPendingAction(null);
    }
  }, [pendingAction, updateCustomerLocation]);

  /**
   * Handle modal close without confirmation
   */
  const handleModalClose = useCallback(() => {
    console.log('❌ [LOCATION GUARD WRAPPER] Location modal closed without confirmation');
    setShowLocationModal(false);
    setPendingAction(null);
    toast.error('Location is required to proceed with booking');
  }, []);

  return (
    <>
      {children({ checkLocationAndProceed })}
      
      {/* Location Modal - Only shown when rental action triggered and location not set */}
      {showLocationModal && (
        <CustomerLeafletLocationModal
          isOpen={showLocationModal}
          onClose={handleModalClose}
          onLocationConfirmed={handleLocationConfirmed}
        />
      )}
    </>
  );
};