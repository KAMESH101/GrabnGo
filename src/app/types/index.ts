export type UserRole = 'customer' | 'owner' | 'admin';

export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export type Category = 'Cars' | 'Bikes' | 'Drones' | 'Cameras' | 'Equipments';

export type BookingStatus = 'requested' | 'pending' | 'approved' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';
// Status flow: requested → approved → confirmed (after advance paid) → active → completed
// 'pending' and 'rejected' kept for backwards compatibility with existing database records

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

export interface KycDocument {
  proofDocumentUrl: string;  // Any government-issued ID (Aadhaar, Passport, Voter ID, etc.)
  livePhotoUrl: string;
  uploadedAt: Date;
}

export interface KycSubmission {
  id: string;
  userId: string;
  role: 'customer' | 'owner';
  proofDocumentUrl: string;  // URL of uploaded proof document (Aadhaar / Passport / Voter ID etc.)
  livePhotoUrl: string;
  aiFaceMatch?: boolean;        // true = backend face-api matched at threshold 0.50
  status: KycStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;          // Admin ID (manual override)
  rejectionReason?: string;
  // ─── Admin-only fields ── never exposed in user-facing UI ─────────────────
  faceMatchDistance?: number;   // Euclidean distance from backend (admin panel only)
  kycVerificationMethod?: string; // e.g. 'FACE_API_MATCH' | 'FACE_API_MISMATCH' | 'MANUAL_OVERRIDE'
}

// Role History for audit trail of role changes
export interface RoleHistoryEntry {
  role: 'owner'; // Only owner role can be added/removed (customer is default)
  addedAt: Date;
  addedBy: 'self' | 'admin';
  adminId?: string; // Admin user ID if added by admin
  removedAt?: Date;
  removedBy?: 'self' | 'admin';
  removedAdminId?: string; // Admin user ID if removed by admin
}

// Audit log for role-related actions
export interface RoleAuditLog {
  id: string;
  userId: string;
  userName: string;
  action:
  | 'owner_role_added'
  | 'owner_role_removed'
  | 'role_switched'
  | 'customer_kyc_updated'
  | 'owner_kyc_updated'
  | 'customer_kyc_reset'
  | 'owner_kyc_reset';
  performedBy: string; // User ID or 'system'
  performedByName: string;
  timestamp: Date;
  details: string;
  previousState?: any;
  newState?: any;
}

export interface User {
  id: string;
  name: string;
  email?: string; // Optional - phone is primary identifier
  phone: string; // Required - primary authentication method
  password?: string; // Hashed password (optional for backward compatibility)

  // Multi-Role Support (NEW)
  roles: UserRole[]; // Array of roles user has (e.g., ['customer'], ['customer', 'owner'])
  activeRole: UserRole; // Currently active role for UI and permissions
  roleHistory: RoleHistoryEntry[]; // Audit trail of role additions/removals

  // Legacy single role field (DEPRECATED - kept for migration compatibility)
  role?: UserRole;

  city?: string;
  locality?: string;
  // Customer verified location (only for customers)
  verifiedLocation?: VerifiedCustomerLocation;
  // Dual KYC Status - Independent for Customer and Owner roles
  customerKycStatus?: KycStatus;
  ownerKycStatus?: KycStatus;
  customerKycData?: KycSubmission;
  ownerKycData?: KycSubmission;
  // Legacy KYC documents (deprecated, use new KYC system)
  kycDocuments?: {
    aadhaar?: string;
    pan?: string;
    proofDocument?: string;  // Proof document number (Aadhaar / Passport / Voter ID etc.)
  };

  // Legacy fields (kept for backward compatibility with existing data)
  firebaseUid?: string;
  phoneVerified?: boolean;
  isMockAccount?: boolean;
  accountLocked?: boolean;
  lockUntil?: number;
  lastOtpRequestTime?: number;
  otpRequestCount?: number;
  otpResendCount?: number;
  otpSentAt?: number;
  resendLockedUntil?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: Category;
  pricePerDay: number;
  pricePerHour?: number;
  deposit?: number; // Optional - defaults to 0 (no deposit required)
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
  deposit?: number; // Optional - defaults to 0 for new bookings, preserved for historical bookings
  gst: number;
  subtotal: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentId?: string; // Razorpay payment ID (legacy - full payment)

  // Advance Payment Model (NEW)
  advancePaid?: boolean; // True when advance has been paid via Razorpay
  advanceAmount?: number; // Amount paid upfront (20% of totalAmount)
  advanceTransactionId?: string; // Razorpay payment ID for advance payment
  remainingAmount?: number; // Amount to be paid directly to owner (80% of totalAmount)
  remainingPaymentStatus?: 'pending' | 'paid_to_owner' | 'paid_online' | 'paid_cash'; // Tracks final payment
  remainingTransactionId?: string; // Razorpay payment ID for remaining payment (online only)
  paymentMethod?: string; // 'razorpay' | 'cash'

  // Pickup location coordinates (copied from Product at booking-creation time)
  // Used to show directions to the customer after confirmation — stored here
  // so we never need to re-fetch the product just to get coordinates.
  pickupLat?: number;
  pickupLng?: number;
  pickupAddress?: string;  // Human-readable pickup address for display

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
  lat: number;
  lng: number;
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