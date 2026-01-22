import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, User } from '../types';
import { 
  createBooking as createBookingService,
  getCustomerBookings as getCustomerBookingsService,
  getOwnerBookings as getOwnerBookingsService,
  getBookingById as getBookingByIdService,
  cancelBooking as cancelBookingService,
  updateBookingStatus as updateBookingStatusService,
  initializeBookingsStorage
} from '../services/bookings';
import { useAuth } from './AuthContext';

interface BookingContextType {
  bookings: Booking[];
  isLoading: boolean;
  createBooking: (bookingData: Omit<Booking, 'id'>) => Promise<Booking>;
  fetchBookings: () => Promise<void>;
  getBookingById: (bookingId: string) => Promise<Booking | null>;
  cancelBooking: (bookingId: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use try-catch to handle hot reload scenarios where AuthProvider might not be ready
  let authContext: { user: User | null };
  try {
    authContext = useAuth();
  } catch (error) {
    // During hot reload, auth context might not be available yet
    console.warn('⚠️ [BOOKING CONTEXT] Auth context not available, likely during hot reload');
    authContext = { user: null };
  }
  
  const { user } = authContext;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize storage on mount
  useEffect(() => {
    initializeBookingsStorage();
  }, []);

  // Fetch bookings when user changes
  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [user?.id, user?.role]);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      console.log('⚠️ [BOOKING CONTEXT] No user logged in, skipping fetch');
      return;
    }

    setIsLoading(true);
    console.log('🔄 [BOOKING CONTEXT] Fetching bookings for user:', {
      userId: user.id,
      role: user.role,
    });

    try {
      let userBookings: Booking[] = [];

      if (user.role === 'customer') {
        userBookings = await getCustomerBookingsService(user.id);
      } else if (user.role === 'owner') {
        userBookings = await getOwnerBookingsService(user.id);
      }

      setBookings(userBookings);

      console.log('✅ [BOOKING CONTEXT] Bookings loaded successfully:', {
        count: userBookings.length,
        userId: user.id,
      });
    } catch (error) {
      console.error('❌ [BOOKING CONTEXT] Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
    console.log('📝 [BOOKING CONTEXT] Creating new booking');

    const newBooking = await createBookingService(bookingData);
    
    // Add to local state immediately
    setBookings(prev => [newBooking, ...prev]);

    console.log('✅ [BOOKING CONTEXT] Booking added to state:', newBooking.id);

    return newBooking;
  }, []);

  const getBookingById = useCallback(async (bookingId: string): Promise<Booking | null> => {
    console.log('🔍 [BOOKING CONTEXT] Getting booking by ID:', bookingId);

    // First check local state
    const localBooking = bookings.find(b => b.id === bookingId);
    if (localBooking) {
      console.log('✅ [BOOKING CONTEXT] Found booking in local state');
      return localBooking;
    }

    // Fetch from service
    const booking = await getBookingByIdService(bookingId);
    return booking;
  }, [bookings]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    console.log('🚫 [BOOKING CONTEXT] Canceling booking:', bookingId);

    const updatedBooking = await cancelBookingService(bookingId);

    if (updatedBooking) {
      // Update local state
      setBookings(prev => 
        prev.map(b => b.id === bookingId ? updatedBooking : b)
      );
      console.log('✅ [BOOKING CONTEXT] Booking cancelled in state');
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    console.log('🔄 [BOOKING CONTEXT] Manually refreshing bookings');
    await fetchBookings();
  }, [fetchBookings]);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        isLoading,
        createBooking,
        fetchBookings,
        getBookingById,
        cancelBooking,
        refreshBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within BookingProvider');
  }
  return context;
};
