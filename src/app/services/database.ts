/**
 * Centralized Database Service
 * Single Source of Truth for all data entities
 * Simulates a backend database using localStorage with real-time sync capabilities
 */

import { User, Product, Booking, UserRole, BookingStatus } from '../types';

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'grabngo_users',
  PRODUCTS: 'grabngo_products',
  BOOKINGS: 'grabngo_bookings',
  CURRENT_USER: 'grabngo_current_user',
} as const;

// ============================================================================
// USERS COLLECTION
// ============================================================================

export const getAllUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const getUserById = (userId: string): User | null => {
  const users = getAllUsers();
  return users.find(u => u.id === userId) || null;
};

export const getUserByEmail = (email: string): User | null => {
  const users = getAllUsers();
  return users.find(u => u.email === email) || null;
};

export const createUser = (user: User): User => {
  const users = getAllUsers();
  
  // Check if email already exists
  if (users.some(u => u.email === user.email)) {
    throw new Error('User with this email already exists');
  }
  
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  console.log('✅ [DATABASE] User created:', user.id, user.role);
  return user;
};

export const updateUser = (userId: string, updates: Partial<User>): User => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  console.log('✅ [DATABASE] User updated:', userId);
  return users[index];
};

export const deleteUser = (userId: string): void => {
  const users = getAllUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  
  console.log('✅ [DATABASE] User deleted:', userId);
};

// ============================================================================
// PRODUCTS COLLECTION
// ============================================================================

export const getAllProducts = (): Product[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return data ? JSON.parse(data) : [];
};

export const getProductById = (productId: string): Product | null => {
  const products = getAllProducts();
  return products.find(p => p.id === productId) || null;
};

export const getProductsByOwnerId = (ownerId: string): Product[] => {
  const products = getAllProducts();
  return products.filter(p => p.ownerId === ownerId);
};

export const getProductsByCategory = (category: string): Product[] => {
  const products = getAllProducts();
  return products.filter(p => p.category === category);
};

export const getAvailableProducts = (): Product[] => {
  const products = getAllProducts();
  return products.filter(p => p.availability === true);
};

export const createProduct = (product: Product): Product => {
  const products = getAllProducts();
  products.push(product);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  
  console.log('✅ [DATABASE] Product created:', product.id, 'by owner:', product.ownerId);
  return product;
};

export const updateProduct = (productId: string, updates: Partial<Product>): Product => {
  const products = getAllProducts();
  const index = products.findIndex(p => p.id === productId);
  
  if (index === -1) {
    throw new Error('Product not found');
  }
  
  products[index] = { ...products[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  
  console.log('✅ [DATABASE] Product updated:', productId);
  return products[index];
};

export const deleteProduct = (productId: string): void => {
  const products = getAllProducts();
  const filtered = products.filter(p => p.id !== productId);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
  
  console.log('✅ [DATABASE] Product deleted:', productId);
};

// ============================================================================
// BOOKINGS COLLECTION
// ============================================================================

export const getAllBookings = (): Booking[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  if (!data) return [];
  
  // Parse and convert date strings back to Date objects
  const bookings = JSON.parse(data);
  const validBookings = bookings
    .map((b: any) => ({
      ...b,
      startDate: new Date(b.startDate),
      endDate: new Date(b.endDate),
      pickupTime: b.pickupTime ? new Date(b.pickupTime) : undefined,
      returnTime: b.returnTime ? new Date(b.returnTime) : undefined,
      createdAt: b.createdAt ? new Date(b.createdAt) : undefined,
      approvedAt: b.approvedAt ? new Date(b.approvedAt) : undefined,
      completedAt: b.completedAt ? new Date(b.completedAt) : undefined,
      customerVerifiedLocation: b.customerVerifiedLocation ? {
        ...b.customerVerifiedLocation,
        verifiedAt: new Date(b.customerVerifiedLocation.verifiedAt)
      } : undefined,
    }))
    .filter((b: any) => {
      // Silently filter out bookings without IDs (already cleaned up on app init)
      return b.id && b.id !== null && b.id !== undefined && b.id !== '';
    });

  return validBookings;
};

export const getBookingById = (bookingId: string): Booking | null => {
  const bookings = getAllBookings();
  return bookings.find(b => b.id === bookingId) || null;
};

export const getBookingsByCustomerId = (customerId: string): Booking[] => {
  const bookings = getAllBookings();
  const customerBookings = bookings.filter(b => b.customerId === customerId);
  
  console.log('🔍 [DATABASE] Getting bookings for customer:', customerId);
  console.log('📊 [DATABASE] Total bookings in database:', bookings.length);
  console.log('📊 [DATABASE] Bookings for this customer:', customerBookings.length);
  
  if (customerBookings.length > 0) {
    console.log('📋 [DATABASE] Customer bookings:', customerBookings.map(b => ({
      id: b.id,
      productTitle: b.productTitle,
      status: b.status,
      hasId: !!b.id
    })));
  }
  
  return customerBookings;
};

export const getBookingsByOwnerId = (ownerId: string): Booking[] => {
  const bookings = getAllBookings();
  const ownerBookings = bookings.filter(b => b.ownerId === ownerId);
  
  console.log('🔍 [DATABASE] Getting bookings for owner:', ownerId);
  console.log('📊 [DATABASE] Total bookings in database:', bookings.length);
  console.log('📊 [DATABASE] Bookings for this owner:', ownerBookings.length);
  
  if (ownerBookings.length > 0) {
    console.log('📋 [DATABASE] Owner bookings:', ownerBookings.map(b => ({
      id: b.id,
      productTitle: b.productTitle,
      customerName: b.customerName,
      status: b.status
    })));
  }
  
  return ownerBookings;
};

export const getBookingsByProductId = (productId: string): Booking[] => {
  const bookings = getAllBookings();
  return bookings.filter(b => b.productId === productId);
};

export const getBookingsByStatus = (status: BookingStatus): Booking[] => {
  const bookings = getAllBookings();
  return bookings.filter(b => b.status === status);
};

export const createBooking = (booking: Booking): Booking => {
  // Validate booking has an ID
  if (!booking.id) {
    console.error('❌ [DATABASE] Attempting to create booking without ID:', booking);
    throw new Error('Cannot create booking without ID');
  }
  
  console.log('📝 [DATABASE] Creating booking:', {
    id: booking.id,
    customerId: booking.customerId,
    ownerId: booking.ownerId,
    hasId: !!booking.id
  });
  
  const bookings = getAllBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  
  console.log('✅ [DATABASE] Booking created:', booking.id, 'Customer:', booking.customerId, 'Owner:', booking.ownerId);
  console.log('📊 [DATABASE] Total bookings now:', bookings.length);
  console.log('🔍 [DATABASE] Booking details:', {
    bookingId: booking.id,
    productId: booking.productId,
    productTitle: booking.productTitle,
    customerId: booking.customerId,
    customerName: booking.customerName,
    ownerId: booking.ownerId,
    status: booking.status,
    totalAmount: booking.totalAmount
  });
  
  // Verify it was saved correctly
  const savedBooking = getBookingById(booking.id);
  if (!savedBooking) {
    console.error('❌ [DATABASE] Failed to retrieve booking after save!');
    throw new Error('Booking save verification failed');
  }
  
  console.log('✅ [DATABASE] Booking verified in storage:', savedBooking.id);
  
  return booking;
};

export const updateBooking = (bookingId: string, updates: Partial<Booking>): Booking => {
  const bookings = getAllBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  
  if (index === -1) {
    throw new Error('Booking not found');
  }
  
  bookings[index] = { ...bookings[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  
  console.log('✅ [DATABASE] Booking updated:', bookingId, updates);
  return bookings[index];
};

export const deleteBooking = (bookingId: string): void => {
  const bookings = getAllBookings();
  const filtered = bookings.filter(b => b.id !== bookingId);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filtered));
  
  console.log('✅ [DATABASE] Booking deleted:', bookingId);
};

// ============================================================================
// SEARCH & FILTER UTILITIES
// ============================================================================

/**
 * Search products by text query
 */
export const searchProducts = (query: string): Product[] => {
  const products = getAvailableProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery) ||
    p.pickupLocality.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Filter products by locality (for location-based discovery)
 */
export const getProductsByLocality = (locality: string): Product[] => {
  const products = getAvailableProducts();
  return products.filter(p => 
    p.pickupLocality.toLowerCase().includes(locality.toLowerCase())
  );
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get products sorted by distance from user location
 */
export const getProductsByDistance = (
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 50
): Product[] => {
  const products = getAvailableProducts();
  
  const productsWithDistance = products.map(p => ({
    ...p,
    distance: calculateDistance(userLat, userLng, p.pickupLat, p.pickupLng)
  }));
  
  return productsWithDistance
    .filter(p => p.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);
};

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export const getOwnerStats = (ownerId: string) => {
  const products = getProductsByOwnerId(ownerId);
  const bookings = getBookingsByOwnerId(ownerId);
  
  return {
    totalListings: products.length,
    activeListings: products.filter(p => p.availability).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    activeBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalEarnings: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };
};

export const getCustomerStats = (customerId: string) => {
  const bookings = getBookingsByCustomerId(customerId);
  
  return {
    totalBookings: bookings.length,
    upcomingBookings: bookings.filter(b => 
      b.status === 'pending' || b.status === 'confirmed' || b.status === 'active'
    ).length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
    totalSpent: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };
};

// ============================================================================
// DATA VALIDATION
// ============================================================================

export const validateBookingDates = (productId: string, startDate: Date, endDate: Date): boolean => {
  const bookings = getBookingsByProductId(productId);
  
  // Check for overlapping bookings
  const hasOverlap = bookings.some(b => {
    if (b.status === 'cancelled' || b.status === 'rejected') {
      return false; // Ignore cancelled/rejected bookings
    }
    
    const bookingStart = b.startDate.getTime();
    const bookingEnd = b.endDate.getTime();
    const requestStart = startDate.getTime();
    const requestEnd = endDate.getTime();
    
    // Check if dates overlap
    return (requestStart < bookingEnd) && (requestEnd > bookingStart);
  });
  
  return !hasOverlap;
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize database with seed data if empty
 */
export const initializeDatabase = () => {
  const users = getAllUsers();
  const products = getAllProducts();
  
  if (users.length === 0) {
    console.log('📦 [DATABASE] Initializing empty database...');
  }
  
  console.log('✅ [DATABASE] Ready - Users:', users.length, 'Products:', products.length);
};