/**
 * Mock Data Generator for Admin Panel
 * Generates realistic mock accounts for testing
 */

import { User, VerifiedCustomerLocation, Category, Booking, BookingStatus, PaymentStatus } from '../types';
import { createUser, createBooking, getAllProducts, getAllUsers } from '../services/database';

// Chennai localities for mock customers
const CHENNAI_LOCALITIES = [
  { locality: 'T Nagar', area: 'Central Chennai', lat: 13.0418, lng: 80.2341 },
  { locality: 'Adyar', area: 'South Chennai', lat: 13.0067, lng: 80.2571 },
  { locality: 'Anna Nagar', area: 'North Chennai', lat: 13.0850, lng: 80.2101 },
  { locality: 'Velachery', area: 'South Chennai', lat: 12.9756, lng: 80.2210 },
  { locality: 'Mylapore', area: 'Central Chennai', lat: 13.0339, lng: 80.2619 },
  { locality: 'Porur', area: 'West Chennai', lat: 13.0358, lng: 80.1563 },
  { locality: 'Perungudi', area: 'South Chennai', lat: 12.9610, lng: 80.2407 },
  { locality: 'Tambaram', area: 'South Chennai', lat: 12.9249, lng: 80.1000 },
  { locality: 'Nungambakkam', area: 'Central Chennai', lat: 13.0569, lng: 80.2425 },
  { locality: 'OMR', area: 'IT Corridor', lat: 12.9129, lng: 80.2273 },
];

// Indian first names
const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Arjun', 'Sneha', 'Vikram',
  'Aishwarya', 'Karthik', 'Divya', 'Rahul', 'Meera',
  'Sanjay', 'Lakshmi', 'Arun', 'Deepa', 'Suresh',
  'Kavya', 'Manoj', 'Nithya', 'Ramesh', 'Pooja',
];

// Indian last names
const LAST_NAMES = [
  'Kumar', 'Sharma', 'Reddy', 'Iyer', 'Patel',
  'Nair', 'Menon', 'Pillai', 'Singh', 'Gupta',
  'Rao', 'Krishnan', 'Sundaram', 'Venkatesh', 'Bose',
];

// Shop names for owners
const SHOP_NAMES = [
  'Chennai Rentals', 'Quick Hire Services', 'Rent & Go',
  'Premier Rentals', 'Easy Rent Solutions',
];

// Category for variety
const CATEGORIES: Category[] = ['Cars', 'Bikes', 'Drones', 'Cameras', 'Equipments'];

/**
 * Generate a random Indian phone number
 */
const generatePhoneNumber = (): string => {
  const prefix = '+91';
  const number = Math.floor(6000000000 + Math.random() * 3999999999);
  const formatted = number.toString().replace(/(\d{5})(\d{5})/, '$1 $2');
  return `${prefix} ${formatted}`;
};

/**
 * Generate a unique email
 */
const generateEmail = (firstName: string, lastName: string, role: string, index: number): string => {
  const name = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${name}.mock${index}@grabngo.com`;
};

/**
 * Generate verified location for customer
 */
const generateVerifiedLocation = (locality: any): VerifiedCustomerLocation => {
  return {
    lat: locality.lat,
    lng: locality.lng,
    locality: locality.locality,
    area: locality.area,
    city: 'Chennai',
    state: 'Tamil Nadu',
    displayAddress: `${locality.locality}, ${locality.area}, Chennai`,
    verifiedAt: new Date(),
    captureMethod: 'gps',
  };
};

/**
 * Create sample bookings for a customer
 */
const createSampleBookingsForCustomer = (customer: User) => {
  const products = getAllProducts();
  
  // Only create bookings if there are products available
  if (products.length === 0) {
    console.log('⚠️ [MOCK] No products available to create bookings');
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - 10);
  const pastReturnDate = new Date(now);
  pastReturnDate.setDate(now.getDate() - 5);

  // Create 1-3 random bookings per customer
  const numBookings = Math.floor(Math.random() * 3) + 1; // 1 to 3 bookings
  
  for (let i = 0; i < numBookings; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const bookingStatuses: BookingStatus[] = ['confirmed', 'pending', 'completed'];
    const randomStatus = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
    
    // Determine dates based on status
    let startDate: Date;
    let endDate: Date;
    
    if (randomStatus === 'completed') {
      startDate = pastDate;
      endDate = pastReturnDate;
    } else {
      startDate = tomorrow;
      endDate = nextWeek;
    }

    // Generate a unique booking ID with more entropy
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const bookingId = `booking_${timestamp}_${random}_${customer.id.substring(customer.id.length - 4)}_${i}`;

    const booking: Booking = {
      id: bookingId,
      productId: product.id,
      productTitle: product.title,
      productImage: product.images[0],
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      ownerId: product.ownerId,
      startDate: startDate,
      endDate: endDate,
      startTime: '10:00',
      endTime: '10:00',
      totalAmount: product.pricePerDay * 3,
      deposit: product.deposit,
      gst: Math.round(product.pricePerDay * 3 * 0.18),
      subtotal: product.pricePerDay * 3,
      status: randomStatus,
      paymentStatus: randomStatus === 'pending' ? 'pending' : 'success',
      pickupVerified: false,
      paymentId: randomStatus === 'pending' ? undefined : `pay_${timestamp}_${random}`,
    };

    // Validate booking has ID before creating
    if (!booking.id) {
      console.error('❌ [MOCK] Generated booking without ID!', booking);
      throw new Error('Failed to generate booking ID');
    }

    console.log(`📝 [MOCK] Creating booking #${i} for ${customer.name}:`, {
      id: booking.id,
      productTitle: booking.productTitle,
      status: booking.status,
      hasId: !!booking.id,
      idLength: booking.id.length
    });

    const createdBooking = createBooking(booking);
    
    console.log(`✅ [MOCK] Booking created in database:`, {
      id: createdBooking.id,
      hasId: !!createdBooking.id,
      matches: createdBooking.id === booking.id
    });
    
    // Add a small delay to ensure unique timestamps
    const delayStart = Date.now();
    while (Date.now() === delayStart) {
      // Wait for timestamp to change
    }
  }
  
  console.log(`✅ [MOCK] Created ${numBookings} sample bookings for ${customer.name}`);
};

/**
 * Create mock customers with sample bookings
 */
export const createMockCustomers = (count: number = 10): User[] => {
  console.log(`🤖 [MOCK] Creating ${count} mock customers...`);
  
  const customers: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const locality = CHENNAI_LOCALITIES[Math.floor(Math.random() * CHENNAI_LOCALITIES.length)];
    
    const customer: User = {
      id: `mock_customer_${Date.now()}_${i}`,
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName, 'customer', i),
      phone: generatePhoneNumber(),
      role: 'customer',
      city: 'Chennai',
      locality: locality.locality,
      verifiedLocation: generateVerifiedLocation(locality),
    };
    
    createUser(customer);
    customers.push(customer);
    
    // Add a small delay to ensure unique timestamps
    const timestamp = Date.now();
    while (Date.now() === timestamp) {
      // Wait for timestamp to change
    }
  }
  
  console.log(`✅ [MOCK] Created ${customers.length} mock customers`);
  
  // Create sample bookings for each customer
  console.log(`🤖 [MOCK] Creating sample bookings for mock customers...`);
  customers.forEach(customer => {
    createSampleBookingsForCustomer(customer);
  });
  
  return customers;
};

/**
 * Create mock owners
 */
export const createMockOwners = (count: number = 5): User[] => {
  console.log(`🤖 [MOCK] Creating ${count} mock owners...`);
  
  const owners: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const shopName = SHOP_NAMES[Math.floor(Math.random() * SHOP_NAMES.length)];
    const locality = CHENNAI_LOCALITIES[Math.floor(Math.random() * CHENNAI_LOCALITIES.length)];
    
    const owner: User = {
      id: `mock_owner_${Date.now()}_${i}`,
      name: `${shopName} (${firstName} ${lastName})`,
      email: generateEmail(firstName, lastName, 'owner', i),
      phone: generatePhoneNumber(),
      role: 'owner',
      city: 'Chennai',
      locality: locality.locality,
      kycDocuments: {
        aadhaar: 'XXXX-XXXX-1234',
        pan: 'ABCDE1234F',
        drivingLicense: 'TN01234567890',
      },
    };
    
    createUser(owner);
    owners.push(owner);
    
    // Add a small delay to ensure unique timestamps
    const timestamp = Date.now();
    while (Date.now() === timestamp) {
      // Wait for timestamp to change
    }
  }
  
  console.log(`✅ [MOCK] Created ${owners.length} mock owners`);
  return owners;
};

/**
 * Get mock account statistics
 */
export const getMockAccountStats = () => {
  const users = JSON.parse(localStorage.getItem('grabngo_users') || '[]');
  
  const mockCustomers = users.filter((u: User) => 
    u.role === 'customer' && u.id.startsWith('mock_customer_')
  );
  
  const mockOwners = users.filter((u: User) => 
    u.role === 'owner' && u.id.startsWith('mock_owner_')
  );
  
  return {
    mockCustomers: mockCustomers.length,
    mockOwners: mockOwners.length,
    totalMock: mockCustomers.length + mockOwners.length,
  };
};

/**
 * Delete all mock accounts and their bookings
 */
export const deleteAllMockAccounts = () => {
  console.log('🗑️ [MOCK] Deleting all mock accounts...');
  
  // Delete mock users
  const users = JSON.parse(localStorage.getItem('grabngo_users') || '[]');
  const filteredUsers = users.filter((u: User) => 
    !u.id.startsWith('mock_customer_') && !u.id.startsWith('mock_owner_')
  );
  localStorage.setItem('grabngo_users', JSON.stringify(filteredUsers));
  
  // Delete mock bookings
  const bookings = JSON.parse(localStorage.getItem('grabngo_bookings') || '[]');
  const filteredBookings = bookings.filter((b: Booking) => 
    !b.customerId.startsWith('mock_customer_')
  );
  localStorage.setItem('grabngo_bookings', JSON.stringify(filteredBookings));
  
  console.log('✅ [MOCK] All mock accounts and bookings deleted');
};

/**
 * Fix corrupted bookings (missing IDs or invalid fields)
 */
export const fixCorruptedBookings = (silent: boolean = false): { fixed: number; removed: number } => {
  if (!silent) {
    console.log('🔧 [MOCK] Checking for corrupted bookings...');
  }
  
  const bookingsRaw = localStorage.getItem('grabngo_bookings');
  if (!bookingsRaw) {
    if (!silent) {
      console.log('✅ [MOCK] No bookings to fix');
    }
    return { fixed: 0, removed: 0 };
  }
  
  const bookings = JSON.parse(bookingsRaw);
  let fixedCount = 0;
  let removedCount = 0;
  
  const cleanedBookings = bookings.filter((b: any) => {
    // Check if booking has an ID
    if (!b.id || b.id === null || b.id === undefined || b.id === '') {
      if (!silent) {
        console.warn('🗑️ [MOCK] Removing booking without ID:', b.productTitle);
      }
      removedCount++;
      return false;
    }
    
    // Check for old invalid fields and remove them
    const hadInvalidFields = 'razorpayOrderId' in b || 'razorpayPaymentId' in b;
    if (hadInvalidFields) {
      if (!silent) {
        console.log('🔧 [MOCK] Fixing booking with old field names:', b.id);
      }
      delete b.razorpayOrderId;
      delete b.razorpayPaymentId;
      fixedCount++;
    }
    
    return true;
  });
  
  // Save cleaned bookings
  localStorage.setItem('grabngo_bookings', JSON.stringify(cleanedBookings));
  
  if (!silent && (fixedCount > 0 || removedCount > 0)) {
    console.log(`✅ [MOCK] Database cleanup complete:`, {
      originalCount: bookings.length,
      cleanedCount: cleanedBookings.length,
      fixed: fixedCount,
      removed: removedCount
    });
  }
  
  return { fixed: fixedCount, removed: removedCount };
};