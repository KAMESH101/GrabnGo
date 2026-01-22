/**
 * Seed Data Utility
 * Populates the database with sample users and products for testing
 */

import { createUser, createProduct, createBooking, getAllUsers, getAllProducts, getAllBookings } from '../services/database';
import { User, Product, Booking } from '../types';

/**
 * Seed sample owners and products
 */
export const seedDatabase = () => {
  const users = getAllUsers();
  const products = getAllProducts();
  const bookings = getAllBookings();

  console.log('🌱 [SEED] Checking database state...');
  console.log('   - Users:', users.length);
  console.log('   - Products:', products.length);
  console.log('   - Bookings:', bookings.length);
  
  // CRITICAL: Never overwrite existing data
  // If ANY data exists (users, products, or bookings), skip seeding entirely
  if (users.length > 0 || products.length > 0 || bookings.length > 0) {
    console.log('✅ [SEED] Database already has data, preserving existing data');
    console.log('💡 [SEED] To reset database, use the "Reset Database" button on Test Accounts page');
    return;
  }
  
  // Log booking details if any exist
  if (bookings.length > 0) {
    console.log('📋 [SEED] Existing bookings:', bookings.map(b => ({
      id: b.id,
      customerId: b.customerId,
      hasId: !!b.id
    })));
    console.log('📦 [SEED] Database already has bookings, skipping seed');
    return;
  }

  console.log('🌱 [SEED] Starting fresh database seed...');

  // Define IDs for reference
  const adminId = 'admin_seed_1';
  const owner1Id = 'owner_seed_1';
  const owner2Id = 'owner_seed_2';
  const product1Id = 'product_seed_1';
  const product2Id = 'product_seed_2';
  const product3Id = 'product_seed_3';
  const product4Id = 'product_seed_4';
  const product5Id = 'product_seed_5';

  // Seed users and products if empty
  if (users.length === 0 && products.length === 0) {
    console.log('🌱 [SEED] Seeding users and products...');

    // Create admin user
    const admin: User = {
      id: adminId,
      name: 'Admin User',
      email: 'admin@grabngo.com',
      phone: '+91 99999 99999',
      role: 'admin',
      city: 'Chennai',
    };

    createUser(admin);

    // Create sample owners
    const owner1: User = {
      id: owner1Id,
      name: 'Rajesh Kumar',
      email: 'rajesh@grabngo.com',
      phone: '+91 98765 43210',
      role: 'owner',
      city: 'Chennai',
      locality: 'T Nagar',
    };

    const owner2: User = {
      id: owner2Id,
      name: 'Priya Sharma',
      email: 'priya@grabngo.com',
      phone: '+91 98765 43211',
      role: 'owner',
      city: 'Chennai',
      locality: 'Adyar',
    };

    createUser(owner1);
    createUser(owner2);

    // Create sample products
    const product1: Product = {
      id: product1Id,
      title: 'Honda City 2022 - Automatic (Petrol)',
      description: 'Well-maintained Honda City with full insurance. Perfect for city tours and weekend getaways. Features include automatic transmission, GPS navigation, and bluetooth connectivity.',
      category: 'Cars',
      pricePerDay: 2500,
      pricePerHour: 250,
      deposit: 10000,
      images: [
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
      ],
      ownerId: owner1.id,
      ownerName: owner1.name,
      pickupLocality: 'T Nagar',
      pickupAddress: 'Shop No. 12, Pondy Bazaar Main Road, T Nagar, Chennai - 600017',
      pickupLat: 13.0418,
      pickupLng: 80.2341,
      pickupInstructions: 'Call 30 minutes before pickup. Parking available in front of the shop.',
      availability: true,
    };

    const product2: Product = {
      id: product2Id,
      title: 'Royal Enfield Classic 350 - 2023',
      description: 'Brand new Royal Enfield Classic 350 in excellent condition. Ideal for long rides and city commutes. Includes helmets and riding gear.',
      category: 'Bikes',
      pricePerDay: 800,
      pricePerHour: 100,
      deposit: 5000,
      images: [
        'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80',
      ],
      ownerId: owner1.id,
      ownerName: owner1.name,
      pickupLocality: 'Anna Nagar',
      pickupAddress: 'No. 45, 2nd Avenue, Anna Nagar West, Chennai - 600040',
      pickupLat: 13.0850,
      pickupLng: 80.2101,
      pickupInstructions: 'Two-wheeler parking available. Call upon arrival.',
      availability: true,
    };

    const product3: Product = {
      id: product3Id,
      title: 'DJI Mavic Air 2 Drone with 4K Camera',
      description: 'Professional-grade drone perfect for aerial photography and videography. Includes 3 batteries, controller, and carrying case. 4K video at 60fps.',
      category: 'Drones',
      pricePerDay: 3000,
      pricePerHour: 400,
      deposit: 15000,
      images: [
        'https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800&q=80',
      ],
      ownerId: owner2.id,
      ownerName: owner2.name,
      pickupLocality: 'Adyar',
      pickupAddress: 'Building 7A, Lattice Bridge Road, Adyar, Chennai - 600020',
      pickupLat: 13.0067,
      pickupLng: 80.2206,
      pickupInstructions: 'Meet at the lobby. Please bring valid ID proof.',
      availability: true,
    };

    const product4: Product = {
      id: product4Id,
      title: 'Canon EOS R6 + 24-70mm f/2.8L Lens',
      description: 'Professional mirrorless camera with full-frame sensor. Perfect for weddings, events, and professional photography. Includes lens, batteries, and memory cards.',
      category: 'Cameras',
      pricePerDay: 2000,
      pricePerHour: 300,
      deposit: 20000,
      images: [
        'https://images.unsplash.com/photo-1606986628650-50388dcbf6e4?w=800&q=80',
      ],
      ownerId: owner2.id,
      ownerName: owner2.name,
      pickupLocality: 'Velachery',
      pickupAddress: '23, Vijaya Nagar 1st Street, Velachery, Chennai - 600042',
      pickupLat: 12.9750,
      pickupLng: 80.2208,
      pickupInstructions: 'Camera handling demo provided. Payment via UPI/Card accepted.',
      availability: true,
    };

    const product5: Product = {
      id: product5Id,
      title: 'Professional DJ Setup with Speakers',
      description: 'Complete DJ equipment set including mixer, turntables, and powerful speakers. Perfect for parties and events. Technical support available.',
      category: 'Equipments',
      pricePerDay: 5000,
      deposit: 25000,
      images: [
        'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80',
      ],
      ownerId: owner1.id,
      ownerName: owner1.name,
      pickupLocality: 'Nungambakkam',
      pickupAddress: 'Studio 8, Khader Nawaz Khan Road, Nungambakkam, Chennai - 600006',
      pickupLat: 13.0569,
      pickupLng: 80.2433,
      pickupInstructions: 'Delivery available for extra charge. Setup assistance provided.',
      availability: true,
    };

    createProduct(product1);
    createProduct(product2);
    createProduct(product3);
    createProduct(product4);
    createProduct(product5);

    console.log('✅ [SEED] Database seeded successfully!');
    console.log('   - Created 1 admin user');
    console.log('   - Created 2 sample owners');
    console.log('   - Created 5 sample products');
    console.log('   - You can now test the application');
  } else {
    console.log('📦 [SEED] Database already fully populated, skipping seed');
  }
};

/**
 * Clear all data from database (for testing)
 */
export const clearDatabase = () => {
  localStorage.removeItem('grabngo_users');
  localStorage.removeItem('grabngo_products');
  localStorage.removeItem('grabngo_bookings');
  console.log('🗑️ [SEED] Database cleared');
};