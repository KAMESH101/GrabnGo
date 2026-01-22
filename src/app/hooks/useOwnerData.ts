// Data source: Listings Collection, Bookings Collection
// Filters: ownerId = loggedInOwner.id

import { useState, useEffect, useCallback } from 'react';
import { Product, Booking } from '../types';
import {
  getProductsByOwnerId,
  createProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  toggleProductAvailability,
} from '../services/products';
import {
  getBookingsByOwnerId,
  getBookingById as dbGetBookingById,
} from '../services/bookings';

export const useOwnerData = (ownerId: string) => {
  const [ownerListings, setOwnerListings] = useState<Product[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch owner data on mount and when ownerId changes
  const fetchOwnerData = useCallback(async () => {
    if (!ownerId) {
      setOwnerListings([]);
      setOwnerBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 [OWNER DATA] Fetching data for owner:', ownerId);
      
      // Fetch in parallel
      const [listings, bookings] = await Promise.all([
        getProductsByOwnerId(ownerId),
        getBookingsByOwnerId(ownerId),
      ]);

      setOwnerListings(listings);
      setOwnerBookings(bookings);

      console.log('✅ [OWNER DATA] Data loaded:', {
        listings: listings.length,
        bookings: bookings.length,
      });
    } catch (err) {
      console.error('❌ [OWNER DATA] Error fetching data:', err);
      setError('Failed to load owner data');
      setOwnerListings([]);
      setOwnerBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchOwnerData();
  }, [fetchOwnerData]);

  // CREATE listing
  const createListing = async (newListing: Omit<Product, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📝 [OWNER DATA] Creating listing');
      const listing = await createProduct(newListing);
      
      // Add to local state
      setOwnerListings(prev => [...prev, listing]);
      
      return listing;
    } catch (err) {
      setError('Failed to create listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE listing
  const updateListing = async (id: string, updates: Partial<Product>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [OWNER DATA] Updating listing:', id);
      const updatedProduct = await dbUpdateProduct(id, updates);
      
      // Update local state
      setOwnerListings(prev =>
        prev.map(listing =>
          listing.id === id ? updatedProduct : listing
        )
      );
    } catch (err) {
      setError('Failed to update listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE listing
  const deleteListing = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ [OWNER DATA] Deleting listing:', id);
      await dbDeleteProduct(id);
      
      // Remove from local state
      setOwnerListings(prev => prev.filter(listing => listing.id !== id));
    } catch (err) {
      setError('Failed to delete listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle listing availability
  const toggleListingAvailability = async (id: string) => {
    try {
      const updatedProduct = await toggleProductAvailability(id);
      
      // Update local state
      setOwnerListings(prev =>
        prev.map(listing =>
          listing.id === id ? updatedProduct : listing
        )
      );
    } catch (err) {
      setError('Failed to toggle availability');
      throw err;
    }
  };

  // GET booking by ID
  const getBookingById = useCallback(async (bookingId: string): Promise<Booking | null> => {
    return dbGetBookingById(bookingId);
  }, []);

  // Refresh data manually
  const refreshData = () => {
    fetchOwnerData();
  };

  return {
    ownerListings,
    ownerBookings,
    isLoading,
    error,
    createListing,
    updateListing,
    deleteListing,
    toggleListingAvailability,
    getBookingById,
    refreshData,
  };
};