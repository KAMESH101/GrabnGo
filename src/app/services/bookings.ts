import { Booking, BookingStatus } from '../types';

// Import centralized database functions
import {
  getAllBookings,
  getBookingById as dbGetBookingById,
  getBookingsByCustomerId,
  getBookingsByOwnerId,
  createBooking as dbCreateBooking,
  updateBooking as dbUpdateBooking,
  deleteBooking as dbDeleteBooking,
} from './database';

/**
 * Initialize bookings storage
 */
export const initializeBookingsStorage = () => {
  console.log('✅ [BOOKINGS SERVICE] Initialized - using centralized database');
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
  console.log('📝 [BOOKINGS SERVICE] Received booking data (before ID generation):', {
    customerId: bookingData.customerId,
    ownerId: bookingData.ownerId,
    productId: bookingData.productId,
    status: bookingData.status,
    hasId: !!(bookingData as any).id
  });

  const generatedId = `booking_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log('🔑 [BOOKINGS SERVICE] Generated booking ID:', generatedId);

  // Remove any existing id property from bookingData to avoid conflicts
  const { id: _, ...cleanBookingData } = bookingData as any;

  const booking: Booking = {
    ...cleanBookingData,
    id: generatedId, // Set ID last to ensure it's not overwritten
    createdAt: new Date(), // Record when customer made the booking
  };

  console.log('📝 [BOOKINGS SERVICE] Creating booking with ID:', {
    id: booking.id,
    customerId: booking.customerId,
    ownerId: booking.ownerId,
    productId: booking.productId,
    status: booking.status,
    createdAt: booking.createdAt,
    hasId: !!booking.id,
    idValue: booking.id,
    idType: typeof booking.id
  });

  // Double check ID is present
  if (!booking.id) {
    console.error('❌ [BOOKINGS SERVICE] ID is missing after assignment!');
    throw new Error('Failed to generate booking ID');
  }

  return dbCreateBooking(booking);
};

/**
 * Get bookings for a customer
 */
export const getCustomerBookings = async (customerId: string): Promise<Booking[]> => {
  console.log('🔍 [BOOKINGS SERVICE] Fetching customer bookings:', customerId);
  return getBookingsByCustomerId(customerId);
};

// Export database functions directly for hook usage
export { 
  getBookingsByCustomerId,
  getBookingsByOwnerId 
} from './database';

/**
 * Get bookings for an owner
 */
export const getOwnerBookings = async (ownerId: string): Promise<Booking[]> => {
  console.log('🔍 [BOOKINGS SERVICE] Fetching owner bookings:', ownerId);
  return getBookingsByOwnerId(ownerId);
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  console.log('🔍 [BOOKINGS SERVICE] Fetching booking:', bookingId);
  return dbGetBookingById(bookingId);
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  additionalData?: Partial<Booking>
): Promise<Booking> => {
  console.log('🔄 [BOOKINGS SERVICE] Updating booking status:', bookingId, status);

  const updates: Partial<Booking> = {
    status,
    ...additionalData,
  };

  if (status === 'confirmed') {
    updates.approvedAt = new Date();
  } else if (status === 'completed') {
    updates.completedAt = new Date();
  }

  return dbUpdateBooking(bookingId, updates);
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string): Promise<Booking | null> => {
  console.log('🚫 [BOOKINGS SERVICE] Canceling booking:', bookingId);

  const booking = await getBookingById(bookingId);
  if (!booking) {
    console.error('❌ Booking not found:', bookingId);
    return null;
  }

  return dbUpdateBooking(bookingId, { status: 'cancelled' });
};

/**
 * Get all bookings (admin use)
 */
export const getAllBookingsForAdmin = async (): Promise<Booking[]> => {
  return getAllBookings();
};