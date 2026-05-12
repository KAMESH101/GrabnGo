/**
 * Seed Data Utility
 * Builds products directly from local asset images using filename conventions.
 * Product Seed Version: v3 (image-filename driven catalog)
 *
 * Filename format: "Product Name_Category.ext"
 * e.g. "Honda City 2022_cars.jpg"
 */

import { createUser, createProduct, getAllUsers, getAllProducts, getAllBookings } from '../services/database';
import { User, Product, Category } from '../types';
import { parseProductImages, ParsedProductImage } from './parseProductImages';
import { deleteAllMockAccounts } from './mockDataGenerator';

// ── Bump this to force a product-only reset on next page load ─────────────────
const PRODUCT_SEED_VERSION = 'v4'; // v4: auto-purges stale demo bookings
const PRODUCT_VERSION_KEY  = 'grabngo_product_seed_version';

// ── Owner IDs ─────────────────────────────────────────────────────────────────
const adminId  = 'admin_seed_1';
const owner1Id = 'owner_seed_1'; // Rajesh Kumar – T Nagar
const owner2Id = 'owner_seed_2'; // Priya Sharma  – Adyar

// ── Chennai pickup locations ──────────────────────────────────────────────────
interface PickupLocation {
  locality:     string;
  address:      string;
  lat:          number;
  lng:          number;
  instructions: string;
}

const LOCATIONS: Record<string, PickupLocation> = {
  TNagar: {
    locality:     'T Nagar',
    address:      'Shop No. 12, Pondy Bazaar Main Road, T Nagar, Chennai – 600017',
    lat:          13.0418, lng: 80.2341,
    instructions: 'Call 30 minutes before pickup. Street parking available.',
  },
  AnnaNagar: {
    locality:     'Anna Nagar',
    address:      'No. 45, 2nd Avenue, Anna Nagar West, Chennai – 600040',
    lat:          13.0850, lng: 80.2101,
    instructions: 'Two-wheeler parking near Gate 2. Call on arrival.',
  },
  Adyar: {
    locality:     'Adyar',
    address:      'Building 7A, Lattice Bridge Road, Adyar, Chennai – 600020',
    lat:          13.0067, lng: 80.2206,
    instructions: 'Meet at lobby. Bring valid ID proof.',
  },
  Velachery: {
    locality:     'Velachery',
    address:      '23, Vijaya Nagar 1st Street, Velachery, Chennai – 600042',
    lat:          12.9750, lng: 80.2208,
    instructions: 'Keys at reception desk.',
  },
  Porur: {
    locality:     'Porur',
    address:      '56, Trunk Road, Porur, Chennai – 600116',
    lat:          13.0358, lng: 80.1563,
    instructions: 'Vehicle parked at front gate. Valid DL required.',
  },
  Mylapore: {
    locality:     'Mylapore',
    address:      '14, Dr Radhakrishnan Salai, Mylapore, Chennai – 600004',
    lat:          13.0339, lng: 80.2619,
    instructions: 'Bring valid ID. Call 20 mins before pickup.',
  },
  Nungambakkam: {
    locality:     'Nungambakkam',
    address:      'Studio 8, Khader Nawaz Khan Road, Nungambakkam, Chennai – 600006',
    lat:          13.0569, lng: 80.2433,
    instructions: 'Delivery available for ₹500 extra within 10 km.',
  },
};

// ── Per-product enrichment: description + pricing ─────────────────────────────
// Key = keyword substring of the parsed image name (case-insensitive)
interface ProductEnrichment {
  description:  string;
  pricePerDay:  number;
  pricePerHour?: number;
  ownerId:      string;
  ownerName:    string;
  ownerPhone:   string;
  location:     PickupLocation;
}

const ENRICHMENT: Array<{ match: string; data: ProductEnrichment }> = [
  // ── Cars ──────────────────────────────────────────────────────────────────
  {
    match: 'honda city',
    data: {
      description:  'Well-maintained Honda City with full insurance. Automatic transmission, GPS navigation, and Bluetooth. Perfect for city tours and weekend getaways.',
      pricePerDay:  2500,
      pricePerHour: 280,
      ownerId:   owner1Id,
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 98765 43210',
      location:  LOCATIONS.TNagar,
    },
  },
  {
    match: 'maruti swift',
    data: {
      description:  'Compact and fuel-efficient sedan ideal for city commutes and day trips. Clean interiors, good AC, and music system.',
      pricePerDay:  1800,
      pricePerHour: 200,
      ownerId:   owner1Id,
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 98765 43210',
      location:  LOCATIONS.Velachery,
    },
  },

  // ── Bikes ─────────────────────────────────────────────────────────────────
  {
    match: 'honda activa',
    data: {
      description:  "India's most trusted scooter. Easy to ride, great mileage, ideal for short-distance daily travel. Perfect for beginners.",
      pricePerDay:  300,
      pricePerHour: 50,
      ownerId:   owner1Id,
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 98765 43210',
      location:  LOCATIONS.Porur,
    },
  },
  {
    match: 'royalenfield',
    data: {
      description:  'Iconic Royal Enfield Classic 350 in excellent condition. Ideal for long rides and city commutes. Helmets and riding gear included.',
      pricePerDay:  800,
      pricePerHour: 100,
      ownerId:   owner1Id,
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 98765 43210',
      location:  LOCATIONS.AnnaNagar,
    },
  },

  // ── Drones ────────────────────────────────────────────────────────────────
  {
    match: 'dji mini',
    data: {
      description:  'Ultra-lightweight sub-250g drone with 4K HDR video and tri-directional obstacle sensing. No pilot licence needed. Perfect for travel and vlogging. Includes 2 batteries and ND filters.',
      pricePerDay:  2000,
      pricePerHour: 280,
      ownerId:   owner2Id,
      ownerName: 'Priya Sharma',
      ownerPhone: '+91 98765 43211',
      location:  LOCATIONS.TNagar,
    },
  },
  {
    match: 'dji phantom',
    data: {
      description:  'Cinema-grade DJI Phantom 4 Pro V2.0 with 1-inch 20MP CMOS sensor, 4K/60fps video, and 5-direction obstacle sensing. Perfect for professional aerial shoots.',
      pricePerDay:  4000,
      pricePerHour: 500,
      ownerId:   owner2Id,
      ownerName: 'Priya Sharma',
      ownerPhone: '+91 98765 43211',
      location:  LOCATIONS.Velachery,
    },
  },

  // ── Cameras ───────────────────────────────────────────────────────────────
  {
    match: 'nikon d850',
    data: {
      description:  'Nikon flagship DSLR with 45.7MP BSI CMOS sensor. Great for landscape, portrait, and commercial photography. Includes 50mm f/1.8 lens and 2 batteries.',
      pricePerDay:  1800,
      pricePerHour: 250,
      ownerId:   owner2Id,
      ownerName: 'Priya Sharma',
      ownerPhone: '+91 98765 43211',
      location:  LOCATIONS.Mylapore,
    },
  },
  {
    match: 'sony alpha',
    data: {
      description:  'Sony A7 III full-frame mirrorless camera with 24.2MP BSI sensor. Excellent low-light performance. Includes 28-70mm kit lens, 2 batteries, and 128GB card.',
      pricePerDay:  2500,
      pricePerHour: 350,
      ownerId:   owner2Id,
      ownerName: 'Priya Sharma',
      ownerPhone: '+91 98765 43211',
      location:  LOCATIONS.AnnaNagar,
    },
  },

  // ── Equipments ────────────────────────────────────────────────────────────
  {
    match: 'pa sound',
    data: {
      description:  'Professional PA system: 2x 12" powered speakers, 8-channel mixer, 2 wireless microphones, and stands. Perfect for seminars, functions, and live events.',
      pricePerDay:  3000,
      ownerId:   owner1Id,
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 98765 43210',
      location:  LOCATIONS.Adyar,
    },
  },
  {
    match: 'dj setup',
    data: {
      description:  'Complete DJ equipment set — Pioneer DDJ-SX3 controller, 2x 15" powered speakers (2000W total), subwoofer, cables and stands. Perfect for parties and events.',
      pricePerDay:  5000,
      ownerId:   owner1Id,
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 98765 43210',
      location:  LOCATIONS.Nungambakkam,
    },
  },
];

/**
 * Match a parsed image name to its enrichment data.
 * Uses case-insensitive substring match against ENRICHMENT list.
 */
const findEnrichment = (name: string): ProductEnrichment | null => {
  const lower = name.toLowerCase();
  const entry = ENRICHMENT.find(e => lower.includes(e.match));
  return entry ? entry.data : null;
};

// ── Category-level fallback pricing (if no enrichment match) ─────────────────
const CATEGORY_DEFAULTS: Record<Category, { pricePerDay: number; pricePerHour?: number }> = {
  Cars:       { pricePerDay: 2000, pricePerHour: 250 },
  Bikes:      { pricePerDay: 600,  pricePerHour: 80  },
  Drones:     { pricePerDay: 2500, pricePerHour: 350 },
  Cameras:    { pricePerDay: 1500, pricePerHour: 200 },
  Equipments: { pricePerDay: 2000 },
};

// ── Build products from parsed image assets ───────────────────────────────────
const buildProductsFromImages = (): Product[] => {
  const parsed: ParsedProductImage[] = parseProductImages();
  const products: Product[] = [];

  parsed.forEach((img, index) => {
    const enrichment = findEnrichment(img.name);
    const defaults   = CATEGORY_DEFAULTS[img.category];

    const ownerId    = enrichment?.ownerId   ?? owner1Id;
    const ownerName  = enrichment?.ownerName ?? 'Rajesh Kumar';
    const ownerPhone = enrichment?.ownerPhone ?? '+91 98765 43210';
    const loc        = enrichment?.location  ?? LOCATIONS.TNagar;

    const product: Product = {
      id: `prod_img_${index}_${img.filename.replace(/[^a-z0-9]/gi, '')}`.slice(0, 60),
      title:       img.name,
      description: enrichment?.description ?? `${img.name} — available for rent in Chennai. Quality assured.`,
      category:    img.category,
      pricePerDay:  enrichment?.pricePerDay  ?? defaults.pricePerDay,
      pricePerHour: enrichment?.pricePerHour ?? defaults.pricePerHour,
      deposit:     0,
      images:      [img.imageUrl],
      ownerId,
      ownerName,
      ownerPhone,
      pickupLocality:     loc.locality,
      pickupAddress:      loc.address,
      pickupLat:          loc.lat,
      pickupLng:          loc.lng,
      pickupInstructions: loc.instructions,
      availability: true,
    };

    products.push(product);
  });

  console.log(`📦 [SEED] Built ${products.length} products from image assets`);
  return products;
};

// ── Reset & reseed products only (preserves users & bookings) ─────────────────
export const resetAndReseedProducts = (): void => {
  console.log('🔄 [SEED] Resetting product catalog to', PRODUCT_SEED_VERSION);
  localStorage.removeItem('grabngo_products');

  const products = buildProductsFromImages();
  products.forEach(p => createProduct(p));

  localStorage.setItem(PRODUCT_VERSION_KEY, PRODUCT_SEED_VERSION);
  console.log(`✅ [SEED] ${products.length} products seeded from asset images`);
};

// ── Main seed function ────────────────────────────────────────────────────────
export const seedDatabase = () => {
  const users    = getAllUsers();
  const products = getAllProducts();
  const bookings = getAllBookings();

  console.log('🌱 [SEED] Checking database state...');
  console.log('   Users:', users.length, '| Products:', products.length, '| Bookings:', bookings.length);

  // ── Product version upgrade (users exist but products are outdated) ─────
  const savedVersion = localStorage.getItem(PRODUCT_VERSION_KEY);
  if (savedVersion !== PRODUCT_SEED_VERSION && users.length > 0) {
    console.log('⬆️ [SEED] Upgrading product catalog:', savedVersion, '→', PRODUCT_SEED_VERSION);
    // Purge stale mock/demo bookings — safe: only removes customerId.startsWith('mock_customer_')
    deleteAllMockAccounts();
    console.log('🧹 [SEED] Stale demo bookings purged');
    resetAndReseedProducts();
    return;
  }

  // ── Fresh install: seed everything ─────────────────────────────────────
  if (users.length === 0 && products.length === 0) {
    console.log('🌱 [SEED] Fresh install — seeding users + products...');

    const admin: User = {
      id: adminId,
      name: 'Admin User',
      email: 'admin@grabngo.com',
      phone: '+91 99999 99999',
      roles: ['admin'], activeRole: 'admin', roleHistory: [], role: 'admin',
      city: 'Chennai',
    };

    const owner1: User = {
      id: owner1Id,
      name: 'Rajesh Kumar',
      email: 'rajesh@grabngo.com',
      phone: '+91 98765 43210',
      roles: ['owner'], activeRole: 'owner', roleHistory: [], role: 'owner',
      city: 'Chennai', locality: 'T Nagar',
      ownerKycStatus: 'verified',
    };

    const owner2: User = {
      id: owner2Id,
      name: 'Priya Sharma',
      email: 'priya@grabngo.com',
      phone: '+91 98765 43211',
      roles: ['owner'], activeRole: 'owner', roleHistory: [], role: 'owner',
      city: 'Chennai', locality: 'Adyar',
      ownerKycStatus: 'verified',
    };

    createUser(admin);
    createUser(owner1);
    createUser(owner2);

    const productList = buildProductsFromImages();
    productList.forEach(p => createProduct(p));
    localStorage.setItem(PRODUCT_VERSION_KEY, PRODUCT_SEED_VERSION);

    console.log('✅ [SEED] Database seeded: 1 admin, 2 owners,', productList.length, 'products');
    return;
  }

  console.log('✅ [SEED] Database up to date — no changes needed');
};

// ── Clear all data (for testing) ──────────────────────────────────────────────
export const clearDatabase = () => {
  localStorage.removeItem('grabngo_users');
  localStorage.removeItem('grabngo_products');
  localStorage.removeItem('grabngo_bookings');
  localStorage.removeItem(PRODUCT_VERSION_KEY);
  console.log('🗑️ [SEED] Database cleared');
};