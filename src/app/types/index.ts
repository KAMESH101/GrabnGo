export type UserRole = 'customer' | 'owner' | 'admin';

export type Category = 'Cars' | 'Bikes' | 'Drones' | 'Cameras' | 'Equipments';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded';

export interface VerifiedCustomerLocation {
  lat: number;
  lng: number;
  locality: string;
  area: string;
  city: string;
  state: string;
  displayAddress: string;
  verifiedAt: Date;
  captureMethod: 'gps' | 'manual';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city?: string;
  locality?: string;
  // Customer verified location (only for customers)
  verifiedLocation?: VerifiedCustomerLocation;
  kycDocuments?: {
    aadhaar?: string;
    pan?: string;
    drivingLicense?: string;
  };
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: Category;
  pricePerDay: number;
  pricePerHour?: number;
  deposit: number;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string; // Added for customer-owner contact
  pickupLocality: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupInstructions: string;
  availability: boolean;
}

export interface Booking {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  // Customer verified location for owner trust
  customerVerifiedLocation?: VerifiedCustomerLocation;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  totalAmount: number;
  deposit: number;
  gst: number;
  subtotal: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentId?: string; // Razorpay payment ID
  pickupVerified: boolean;
  pickupPhotoUrl?: string;
  pickupPhotoS3Key?: string; // S3 storage key
  pickupTime?: Date;
  returnTime?: Date;
  createdAt?: Date; // When customer booked the rental
  approvedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
}

export interface ChennaiLocality {
  name: string;
  area: string;
}

export interface PaymentDetails {
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface NotificationLog {
  id: string;
  bookingId: string;
  type: 'sms' | 'email';
  recipient: string;
  message: string;
  status: 'sent' | 'failed';
  sentAt: Date;
}

export interface AuditLog {
  id: string;
  bookingId: string;
  action: 'photo_captured' | 'photo_deleted' | 'payment_success' | 'booking_approved' | 'booking_rejected' | 'rental_completed';
  performedBy: string;
  details: string;
  timestamp: Date;
}