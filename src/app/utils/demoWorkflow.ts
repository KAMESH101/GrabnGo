/**
 * Dynamic Mock Data Workflow - Demonstration Utility
 * 
 * This module demonstrates the complete Owner → Customer workflow
 * with dynamic data creation, storage, and real-time visibility
 */

import { createUser, createProduct, createBooking, getAllUsers, getAllProducts, getAllBookings } from '../services/database';
import { User, Product, Booking } from '../types';

/**
 * Demo Workflow Step 1: Create Owner Account
 */
export const createDemoOwner = (index: number = 1): User => {
  const owner: User = {
    id: `demo_owner_${index}_${Date.now()}`,
    name: `Demo Owner ${index}`,
    email: `owner${index}@demo.grabngo.com`,
    phone: `+91 9876${54320 + index}`,
    role: 'owner',
    city: 'Chennai',
    locality: index === 1 ? 'T Nagar' : 'Adyar',
  };

  try {
    createUser(owner);
    console.log('✅ [DEMO] Owner created:', owner.email);
    return owner;
  } catch (error) {
    console.warn('⚠️ [DEMO] Owner already exists or error:', error);
    return owner;
  }
};

/**
 * Demo Workflow Step 2: Owner Creates Product Listing
 */
export const createDemoListing = (ownerId: string, ownerName: string, productNumber: number = 1): Product => {
  const productTemplates = [
    {
      title: 'Honda City 2023 - Premium Sedan',
      description: 'Brand new Honda City with automatic transmission, GPS, and premium features. Perfect for family trips and business meetings.',
      category: 'Cars' as const,
      pricePerDay: 2800,
      pricePerHour: 300,
      deposit: 12000,
      images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'],
      locality: 'T Nagar',
      address: 'Shop 15, Pondy Bazaar Main Road, T Nagar, Chennai - 600017',
      lat: 13.0418,
      lng: 80.2341,
      instructions: 'Call 30 min before pickup. Free parking available.',
    },
    {
      title: 'Royal Enfield Meteor 350 - 2023',
      description: 'Well-maintained Royal Enfield Meteor with full documentation. Helmets and riding gear included.',
      category: 'Bikes' as const,
      pricePerDay: 900,
      pricePerHour: 120,
      deposit: 6000,
      images: ['https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&q=80'],
      locality: 'Anna Nagar',
      address: 'No. 45, 2nd Avenue, Anna Nagar West, Chennai - 600040',
      lat: 13.0850,
      lng: 80.2101,
      instructions: 'Two-wheeler parking available at gate.',
    },
    {
      title: 'DJI Mini 3 Pro - 4K Drone',
      description: 'Professional drone with 4K camera, 3 batteries, and carrying case. Perfect for aerial photography.',
      category: 'Drones' as const,
      pricePerDay: 3500,
      pricePerHour: 450,
      deposit: 18000,
      images: ['https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800&q=80'],
      locality: 'Velachery',
      address: '23, Vijaya Nagar 1st Street, Velachery, Chennai - 600042',
      lat: 12.9750,
      lng: 80.2208,
      instructions: 'ID proof mandatory. Training provided.',
    },
    {
      title: 'Canon EOS R5 + 24-70mm Lens',
      description: 'Professional mirrorless camera perfect for events and photography. Includes extra batteries and memory cards.',
      category: 'Cameras' as const,
      pricePerDay: 2200,
      pricePerHour: 350,
      deposit: 22000,
      images: ['https://images.unsplash.com/photo-1606986628650-50388dcbf6e4?w=800&q=80'],
      locality: 'Adyar',
      address: 'Building 7A, Lattice Bridge Road, Adyar, Chennai - 600020',
      lat: 13.0067,
      lng: 80.2206,
      instructions: 'Camera handling demo included.',
    },
    {
      title: 'Professional Sound System - Complete Setup',
      description: 'High-end PA system with mixer, speakers, and microphones. Perfect for events and parties.',
      category: 'Equipments' as const,
      pricePerDay: 5500,
      deposit: 28000,
      images: ['https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80'],
      locality: 'Nungambakkam',
      address: 'Studio 8, Khader Nawaz Khan Road, Nungambakkam, Chennai - 600006',
      lat: 13.0569,
      lng: 80.2433,
      instructions: 'Delivery available for extra charge.',
    },
  ];

  const template = productTemplates[(productNumber - 1) % productTemplates.length];

  const product: Product = {
    id: `demo_product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    title: template.title,
    description: template.description,
    category: template.category,
    pricePerDay: template.pricePerDay,
    pricePerHour: template.pricePerHour,
    deposit: template.deposit,
    images: template.images,
    ownerId: ownerId,
    ownerName: ownerName,
    pickupLocality: template.locality,
    pickupAddress: template.address,
    pickupLat: template.lat,
    pickupLng: template.lng,
    pickupInstructions: template.instructions,
    availability: true,
  };

  createProduct(product);
  console.log('✅ [DEMO] Product created:', product.title, 'ID:', product.id);
  return product;
};

/**
 * Demo Workflow Step 3: Create Customer Account
 */
export const createDemoCustomer = (index: number = 1): User => {
  const customer: User = {
    id: `demo_customer_${index}_${Date.now()}`,
    name: `Demo Customer ${index}`,
    email: `customer${index}@demo.grabngo.com`,
    phone: `+91 8765${43210 + index}`,
    role: 'customer',
    city: 'Chennai',
    locality: 'Anna Nagar',
    verifiedLocation: {
      lat: 13.0850,
      lng: 80.2101,
      locality: 'Anna Nagar',
      area: 'Anna Nagar West',
      city: 'Chennai',
      state: 'Tamil Nadu',
      displayAddress: 'Anna Nagar West, Chennai, Tamil Nadu',
      verifiedAt: new Date(),
      captureMethod: 'gps',
    },
  };

  try {
    createUser(customer);
    console.log('✅ [DEMO] Customer created:', customer.email);
    return customer;
  } catch (error) {
    console.warn('⚠️ [DEMO] Customer already exists or error:', error);
    return customer;
  }
};

/**
 * Demo Workflow Step 4: Customer Books Product
 */
export const createDemoBooking = (customerId: string, customerName: string, product: Product): Booking => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Tomorrow

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 2); // Day after tomorrow

  const days = 2;
  const subtotal = days * product.pricePerDay;
  const gst = Math.floor(subtotal * 0.18);
  const total = subtotal + gst;

  const booking: Booking = {
    id: `demo_booking_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.images[0],
    customerId: customerId,
    customerName: customerName,
    customerPhone: '+91 87654 32101',
    customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@demo.com`,
    customerVerifiedLocation: {
      lat: 13.0850,
      lng: 80.2101,
      locality: 'Anna Nagar',
      area: 'Anna Nagar West',
      city: 'Chennai',
      state: 'Tamil Nadu',
      displayAddress: 'Anna Nagar West, Chennai, Tamil Nadu',
      verifiedAt: new Date(),
      captureMethod: 'gps',
    },
    ownerId: product.ownerId,
    startDate: startDate,
    endDate: endDate,
    startTime: '09:00',
    endTime: '18:00',
    totalAmount: total,
    deposit: product.deposit,
    gst: gst,
    subtotal: subtotal,
    status: 'pending',
    paymentStatus: 'success',
    paymentId: `razorpay_demo_${Date.now()}`,
    pickupVerified: false,
  };

  createBooking(booking);
  console.log('✅ [DEMO] Booking created:', booking.id);
  return booking;
};

/**
 * Run Complete Demo Workflow
 * Demonstrates the entire Owner → Customer → Booking flow
 */
export const runCompleteDemo = () => {
  console.log('\n🚀 [DEMO WORKFLOW] Starting complete demonstration...\n');

  // Step 1: Create Owner
  console.log('📋 Step 1: Creating Owner Account...');
  const owner = createDemoOwner(1);

  // Step 2: Owner Creates Multiple Listings
  console.log('\n📋 Step 2: Owner Creating Product Listings...');
  const product1 = createDemoListing(owner.id, owner.name, 1);
  const product2 = createDemoListing(owner.id, owner.name, 2);
  const product3 = createDemoListing(owner.id, owner.name, 3);

  // Step 3: Create Customer
  console.log('\n📋 Step 3: Creating Customer Account...');
  const customer = createDemoCustomer(1);

  // Step 4: Customer Books Product
  console.log('\n📋 Step 4: Customer Booking Product...');
  const booking = createDemoBooking(customer.id, customer.name, product1);

  // Verify Data
  console.log('\n✅ [DEMO WORKFLOW] Complete! Verification:');
  console.log('   👤 Users:', getAllUsers().length);
  console.log('   📦 Products:', getAllProducts().length);
  console.log('   📅 Bookings:', getAllBookings().length);
  console.log('\n🎯 [DEMO WORKFLOW] Next Steps:');
  console.log('   1. Login as Owner:', owner.email);
  console.log('   2. View listings in "Manage Listings"');
  console.log('   3. Check "Manage Bookings" for incoming booking');
  console.log('   4. Login as Customer:', customer.email);
  console.log('   5. View products on home page');
  console.log('   6. Check "My Bookings" for your booking\n');

  return {
    owner,
    customer,
    products: [product1, product2, product3],
    booking,
  };
};

/**
 * Verify Real-Time Integration
 * Tests that data flows correctly between Owner and Customer
 */
export const verifyIntegration = () => {
  console.log('\n🔍 [INTEGRATION TEST] Starting verification...\n');

  const users = getAllUsers();
  const products = getAllProducts();
  const bookings = getAllBookings();

  console.log('📊 Database State:');
  console.log('   Total Users:', users.length);
  console.log('   - Owners:', users.filter(u => u.role === 'owner').length);
  console.log('   - Customers:', users.filter(u => u.role === 'customer').length);
  console.log('   Total Products:', products.length);
  console.log('   - Available:', products.filter(p => p.availability).length);
  console.log('   - Unavailable:', products.filter(p => !p.availability).length);
  console.log('   Total Bookings:', bookings.length);
  console.log('   - Pending:', bookings.filter(b => b.status === 'pending').length);
  console.log('   - Confirmed:', bookings.filter(b => b.status === 'confirmed').length);

  // Verify relationships
  console.log('\n🔗 Relationship Verification:');
  
  products.forEach(product => {
    const owner = users.find(u => u.id === product.ownerId);
    const productBookings = bookings.filter(b => b.productId === product.id);
    console.log(`   Product: "${product.title}"`);
    console.log(`     ├─ Owner: ${owner ? owner.name : 'NOT FOUND ❌'}`);
    console.log(`     └─ Bookings: ${productBookings.length}`);
  });

  bookings.forEach(booking => {
    const customer = users.find(u => u.id === booking.customerId);
    const owner = users.find(u => u.id === booking.ownerId);
    const product = products.find(p => p.id === booking.productId);
    console.log(`   Booking: ${booking.id}`);
    console.log(`     ├─ Customer: ${customer ? customer.name : 'NOT FOUND ❌'}`);
    console.log(`     ├─ Owner: ${owner ? owner.name : 'NOT FOUND ❌'}`);
    console.log(`     └─ Product: ${product ? product.title : 'NOT FOUND ❌'}`);
  });

  console.log('\n✅ [INTEGRATION TEST] Verification complete!\n');
};

/**
 * Simulate Owner Adding Product in Real-Time
 */
export const simulateOwnerAddProduct = () => {
  const owners = getAllUsers().filter(u => u.role === 'owner');
  
  if (owners.length === 0) {
    console.error('❌ No owners found. Run runCompleteDemo() first.');
    return null;
  }

  const owner = owners[0];
  const product = createDemoListing(owner.id, owner.name, Date.now() % 5 + 1);
  
  console.log('✅ [REAL-TIME TEST] Owner added new product:');
  console.log('   Title:', product.title);
  console.log('   Category:', product.category);
  console.log('   Price:', `₹${product.pricePerDay}/day`);
  console.log('\n🔄 Refresh customer page to see new product!');
  
  return product;
};

/**
 * Export utility for browser console
 */
if (typeof window !== 'undefined') {
  (window as any).demoWorkflow = {
    runComplete: runCompleteDemo,
    verify: verifyIntegration,
    addProduct: simulateOwnerAddProduct,
    createOwner: createDemoOwner,
    createCustomer: createDemoCustomer,
  };
}
