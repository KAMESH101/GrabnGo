# GrabNGo — Project Architecture

## Overview

**GrabNGo** is a peer-to-peer rental marketplace where customers rent vehicles/equipment from owners. It is a **React SPA** (Single Page Application) with Firebase authentication, Firestore database, Razorpay payments, and AI-powered KYC verification.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Routing | React Router v7 (`createBrowserRouter`) |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Phone Auth (OTP) + Password |
| Database | Firebase Firestore (+ localStorage mock for dev) |
| Payments | Razorpay (advance payment model) |
| Maps | Google Maps JavaScript API |
| KYC Storage | AWS S3 (via `kycStorage.ts`) |
| Face Matching | face-api.js (client-side AI) |
| Notifications | Toast via `sonner` |

---

## Folder Structure

```
src/
├── main.tsx                    # App entry point
└── app/
    ├── App.tsx                 # Router + Providers setup
    ├── types/index.ts          # All TypeScript interfaces
    ├── context/
    │   ├── AuthContext.tsx     # Global auth state (user, login, logout)
    │   └── BookingContext.tsx  # Booking state
    ├── hooks/
    │   ├── useOwnerData.ts     # Owner bookings + products
    │   ├── useProducts.ts      # Product listing + filtering
    │   └── useLocationGuard.ts # Location permission guard
    ├── services/               # Business logic layer (14 files)
    ├── pages/                  # Route-level page components
    │   ├── auth/               # Login, Signup, ForgotPassword
    │   ├── customer/           # Customer-facing pages (7)
    │   ├── owner/              # Owner-facing pages (9)
    │   └── admin/              # Admin panel pages (13)
    ├── components/             # Reusable UI components
    │   ├── kyc/                # KYC flow components
    │   ├── owner/              # Owner-specific components
    │   ├── customer/           # Customer-specific components
    │   ├── shared/             # Navbar, StatusBadge, etc.
    │   └── ui/                 # shadcn/ui primitives (49 components)
    ├── utils/                  # Helpers, seed data, mock generators
    └── config/                 # App configuration
```

---

## User Roles

A user can hold **multiple roles simultaneously** (e.g., both Customer and Owner).

| Role | Access |
|---|---|
| **Customer** | Browse products, book, pay advance, track rentals |
| **Owner** | List products, manage bookings, verify pickup, collect payment, complete rentals |
| **Admin** | Full platform oversight — KYC review, user/product/booking management |

---

## Pages & Routes

### Public
| Route | Page |
|---|---|
| `/` | `LandingPage` |
| `/customer/login` | `CustomerLogin` |
| `/customer/signup` | `CustomerSignup` |
| `/owner/login` | `OwnerLogin` |
| `/owner/signup` | `OwnerSignup` |
| `/admin/login` | `AdminLogin` |

### Customer (Protected — role: `customer`)
| Route | Page |
|---|---|
| `/customer/home` | `CustomerHome` — browse products |
| `/customer/search` | `SearchPage` |
| `/customer/product/:id` | `ProductDetail` |
| `/customer/booking/:id` | `BookingPage` — create booking + pay advance |
| `/customer/dashboard` | `CustomerDashboard` — active bookings list |
| `/customer/bookings/:bookingId` | `CustomerBookingDetails` |
| `/customer/profile` | `CustomerProfile` |

### Owner (Protected — role: `owner`)
| Route | Page |
|---|---|
| `/owner/dashboard` | `OwnerDashboard` |
| `/owner/create-listing` | `CreateListing` |
| `/owner/manage-listings` | `ManageListings` |
| `/owner/edit-listing/:id` | `EditListing` |
| `/owner/bookings` | `BookingManagement` — accept/reject/complete |
| `/owner/booking/:bookingId` | `BookingDetails` — detailed view |
| `/owner/verify/:bookingId` | `PhotoVerification` — pickup camera capture |
| `/owner/reports` | `Reports` |
| `/owner/profile` | `OwnerProfile` |

### Admin (Protected — role: `admin`)
| Route | Page |
|---|---|
| `/admin/dashboard` | `AdminDashboard` |
| `/admin/users/customers` | `CustomerManagement` |
| `/admin/users/owners` | `OwnerManagement` |
| `/admin/products` | `ProductManagement` |
| `/admin/bookings` | `AdminBookingManagement` |
| `/admin/kyc/customer` | `CustomerKycReview` |
| `/admin/kyc/owner` | `OwnerKycReview` |
| `/admin/locations` | `LocationMonitoring` |
| `/admin/photos` | `PhotoManagement` |
| `/admin/data-consistency` | `DataConsistency` |

---

## Services Layer

| Service | Responsibility |
|---|---|
| `database.ts` | CRUD for users, products, bookings (Firebase + localStorage) |
| `firebaseAuth.service.ts` | Firebase phone OTP + password authentication |
| `kyc.ts` | KYC submission orchestration |
| `kycStorage.ts` | Upload KYC documents to AWS S3 |
| `faceMatching.ts` | AI face comparison via face-api.js |
| `razorpay.ts` | Advance payment calculation + Razorpay integration |
| `storage.ts` | Pickup photo upload/delete (AWS S3) |
| `maps.ts` | Google Maps geocoding + nearby search |
| `customerLocation.ts` | GPS location capture + reverse geocoding |
| `notifications.ts` | SMS/email notifications |
| `otp.ts` | OTP generation + verification (non-Firebase fallback) |
| `roleService.ts` | Multi-role management + audit logs |
| `products.ts` | Product filtering/search helpers |
| `bookings.ts` | Booking utility helpers |

---

## Core Data Models

### `User`
```typescript
{
  id, name, phone,          // phone is primary identifier
  email?, password?,
  roles[],                  // ['customer'] | ['owner'] | ['customer','owner'] | ['admin']
  activeRole,               // currently active role
  roleHistory[],            // audit trail
  customerKycStatus,        // 'not_submitted' | 'pending' | 'verified' | 'rejected'
  ownerKycStatus,
  customerKycData,          // KycSubmission object
  ownerKycData,
  firebaseUid,
  verifiedLocation          // GPS-verified location (customers only)
}
```

### `Product`
```typescript
{
  id, title, description, category,
  pricePerDay, pricePerHour?, deposit?,
  images[],
  ownerId, ownerName, ownerPhone,
  pickupLocality, pickupAddress,
  pickupLat, pickupLng,
  availability
}
```

### `Booking`
```typescript
{
  id, productId, customerId, ownerId,
  startDate, endDate,
  totalAmount, gst, subtotal, deposit,
  status,                          // 'pending'|'confirmed'|'active'|'completed'|'cancelled'|'rejected'
  paymentStatus, paymentId,

  // Advance Payment Model
  advancePaid,                     // true when 20% paid via Razorpay
  advanceAmount,                   // 20% of totalAmount
  remainingAmount,                 // 80% of totalAmount (paid directly to owner)
  remainingPaymentStatus,          // 'pending' | 'paid_to_owner'

  // Pickup Verification
  pickupVerified,
  pickupPhotoUrl,
  pickupPhotoS3Key
}
```

---

## Booking Lifecycle

```
Customer books product
    → Pays 20% advance via Razorpay          [status: pending]
    → Owner accepts booking                  [status: confirmed]
    → Owner starts rental + captures photo   [status: active]
    → Customer pays 80% remaining to owner (cash/UPI)
    → Owner confirms payment received        [remainingPaymentStatus: paid_to_owner]
    → Owner completes rental                 [status: completed]
        → Pickup photo deleted (privacy)
        → Security deposit refunded to customer
```

---

## Payment Model

| Stage | Direction | Method | Amount |
|---|---|---|---|
| Booking | Customer → Platform | Razorpay online | 20% of total (advance) |
| Rental end | Customer → Owner | Cash / UPI (direct) | 80% of total (remaining) |
| Completion | Platform → Customer | Razorpay refund | Security deposit |

---

## KYC Verification Flow

```
Step 1: Upload Driving License photo
Step 2: Capture Live Photo via webcam
Step 3: AI Face Match (face-api.js, runs in browser)
    ✅ Match → KYC submitted → "Pending admin review"
    ❌ Fail  → "Face Verification Failed" screen
               Options: Redo KYC | Contact Admin
Step 4: Admin reviews documents → Approve / Reject
```

> **Note:** There is NO OTP fallback for face match failure. Users must redo KYC or contact admin.

---

## Authentication Flow

```
Enter Phone Number
    → Firebase sends OTP
    → User verifies OTP
    → New user:      Set password → Choose role → Account created
    → Existing user: Enter password → Logged in
    → Role-based redirect (customer/owner/admin dashboard)
```

---

## Component Architecture

| Group | Components |
|---|---|
| `components/kyc/` | `KycModal`, `DocumentUpload`, `LiveCameraCapture`, `OtpVerification` |
| `components/owner/` | `OwnerBookingRow`, `OwnerDashboardStats`, `OwnerProductCard` |
| `components/customer/` | `BookingCard`, `ProductCard`, `LocationPicker` |
| `components/shared/` | `Navbar`, `StatusBadge`, `Card`, `Button`, `Alert`, `Separator` |
| `components/ui/` | 49 shadcn/ui primitives (Dialog, Badge, Progress, etc.) |

---

## Security Features

- **Role-based route protection** via `ProtectedRoute` wrapper
- **KYC required** before customers can book or owners can list
- **Pickup photo** captured at rental start, deleted on completion (privacy compliance)
- **Audit logs** for all critical actions (photo events, payments, role changes)
- **Account locking** after too many failed OTP/password attempts
- **Remaining payment guard** — owner cannot complete rental until payment is confirmed
