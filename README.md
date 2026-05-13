# 🚗 GrabNGo — Rental Management Platform

A full-stack, web-based rental management platform that connects **Customers** and **Owners** with a seamless booking workflow, location-based product discovery, secure camera-verified handovers, integrated Razorpay payments, AI-powered KYC verification, and a dedicated Admin monitoring panel.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#-live-demo)
- [Key Highlights](#-key-highlights)
- [Features](#-features)
  - [Customer Features](#-customer-features)
  - [Owner Features](#-owner-features)
  - [Admin Panel](#-admin-panel)
  - [Camera Verification](#-camera-verification)
  - [Location-Based Features](#-location-based-features)
  - [Razorpay Payment Integration](#-razorpay-payment-integration)
  - [AI-Powered KYC Verification](#-ai-powered-kyc-verification)
- [Booking Workflow](#-booking-workflow)
- [Tech Stack](#-tech-stack)
- [Product System](#-product-system)
- [Authentication](#-authentication)
- [Core Functionalities](#-core-functionalities)
- [Important Constraints](#-important-constraints)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## Overview

GrabNGo is designed as a complete rental ecosystem where:

- **Customers** can browse, filter, and rent products based on their location.
- **Owners** can list products with images, pricing, and pickup locations, then manage incoming booking requests.
- **Admins** can monitor the entire platform — users, products, bookings — and generate mock data for testing.

The platform enforces a structured booking lifecycle (`Requested → Approved → Confirmed → Active → Closed`) with real Razorpay payments, browser-based AI face verification for KYC, and live camera capture for secure product handover.

---

## 🌐 Live Demo

**Production:** [https://grab-n-go-kamesh.vercel.app](https://grab-n-go-kamesh.vercel.app)

> The app is deployed on Vercel with serverless payment APIs. All features including payments and KYC work in the live demo.

---

## ✨ Key Highlights

| Feature | Technology |
|---|---|
| Location-based product discovery | Leaflet + OpenStreetMap |
| Secure product handover | Browser Camera API |
| Real payment processing | Razorpay (Test Mode) |
| AI face verification (KYC) | face-api.js (in-browser) |
| Role-based access control | Customer / Owner / Admin |
| Auto-deploy on every push | Vercel + GitHub |

---

## 🚀 Features

### 👤 Customer Features

- **Signup & Login** — Email and password-based authentication (no OTP, no Firebase)
- **Browse Products** — View all available rental products with images, pricing, and details
- **Filter by Category** — Filter products by categories (Cars, Bikes, Cameras, Drones, Equipment)
- **Product Details** — Detailed product pages with full descriptions, pricing, and owner info
- **Location Selection** — Interactive Leaflet map for selecting rental/delivery location
- **Rent Products** — One-click booking with automatic advance amount calculation
- **Booking Status Tracking** — Real-time status updates through the complete lifecycle:
  - `Requested` → Waiting for owner approval
  - `Approved` → Owner accepted; pay advance to confirm
  - `Confirmed` → Advance paid; awaiting rental start
  - `Active` → Rental in progress
  - `Closed` → Rental completed
- **Bookings Dashboard** — View all current and past bookings with status badges
- **View Details** — Detailed booking view with payment info, dates, and status history
- **Notifications** — Receive real-time notifications when the owner approves a booking
- **KYC Verification** — AI-powered identity verification before first rental
- **Razorpay Payments** — Pay advance and remaining amounts via Card or Netbanking

### 🧑‍💼 Owner Features

- **Owner Login** — Separate authentication portal for product owners
- **Create Product Listings** — Add rental products with:
  - Product image upload
  - Category selection
  - Pricing (per day / per hour)
  - Pickup location via interactive Leaflet map
- **Auto Product Display** — Listed products appear instantly on the customer-facing marketplace
- **Bookings Dashboard** — View all incoming booking requests with customer details
- **Approve / Reject Bookings** — Accept or decline rental requests with optional reason
- **Confirm Handover** — Camera-based verification when handing over the product to the customer
- **KYC Verification** — Owner identity verification before listing products

### 🛠 Admin Panel

- **Separate Admin Login** — Dedicated admin authentication
- **Dashboard Overview** — Real-time statistics showing:
  - Total registered customers
  - Total registered owners
  - Total listed products
  - Total bookings across the platform
- **Mock Data Generation** — Create test data with one click:
  - 10 sample customers
  - 5 sample owners
  - Associated products and bookings
- **View All Bookings** — Read-only access to all platform bookings
- **Customer Management** — View all registered customers and their KYC status
- **Owner Management** — View all registered owners and their listings
- **Product Management** — Monitor all listed products across the platform
- **System Monitoring** — Overview of platform health and activity
- **Non-Intrusive** — Admin operations do not interfere with the active rental flow

### 📷 Camera Verification

A critical security feature for verifying product handover:

- **Triggered only** when: Owner → View Bookings → Confirm Handover
- **Opens real browser camera** using the `getUserMedia` API
- **Live preview** shown in the UI before capture
- **Capture customer photo** — takes a snapshot of the customer receiving the product
- **Photo linked to booking** — saved temporarily as part of the booking record
- **Retake option** — owner can retake the photo if the first capture is unclear
- **Camera closes** automatically after successful capture
- **Auto-deletion** — photo is automatically deleted after the rental is completed (privacy-first)

### 📍 Location-Based Features

- **Leaflet Map Integration** — Full interactive maps powered by OpenStreetMap (no Google API)
- **Customer Location Selection** — Location picker appears only when renting (not on every page load)
- **Owner Pickup Location** — Set during product listing creation via map pin
- **Readable Addresses** — Locations stored as human-readable area names (not raw coordinates)
- **Nearby Products** — Products displayed based on proximity to the customer's selected location
- **No Repeated Popups** — Location is remembered; no redundant location prompts (clean UX)

### 💳 Razorpay Payment Integration

- **Real Payment Gateway** — Integrated with Razorpay SDK (Test Mode)
- **Advance Payment** — 20% advance collected after owner approves booking
- **Remaining Payment** — Balance payable after rental starts
- **Supported Methods:**
  - 🏦 Netbanking (No OTP — select any bank, click "Success")
  - 💳 Debit / Credit Card (test credentials displayed on the page)
- **Server-Side Verification** — HMAC-SHA256 signature verification via serverless API
- **Test Credentials Panel** — Built-in guide visible on the booking page so anyone (including recruiters) can test payments without private knowledge

### 🤖 AI-Powered KYC Verification

- **face-api.js** — Browser-based AI face matching (no backend required)
- **Document Upload** — Upload government ID / proof document
- **Live Camera Capture** — Take a live selfie for face comparison
- **AI Face Matching** — Euclidean distance-based face descriptor comparison
- **Instant Results** — Verified or rejected in seconds
- **Models from CDN** — TinyFaceDetector + FaceLandmark68 + FaceRecognition loaded from jsDelivr
- **Privacy-First** — All processing happens in the user's browser; no images sent to external servers

---

## 🔄 Booking Workflow

```
Customer selects product → clicks "Rent"
        │
        ▼
Booking request sent to Owner (status: Requested)
        │
        ▼
Owner reviews and approves booking (status: Approved)
        │
        ▼
Customer receives notification
        │
        ▼
Customer pays advance via Razorpay (status: Confirmed)
        │
        ▼
Customer visits pickup location
        │
        ▼
Owner confirms handover → Camera opens
        │
        ▼
Customer photo captured and linked to booking (status: Active)
        │
        ▼
Rental period completes (status: Closed)
        │
        ▼
Customer photo automatically deleted
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Components** | Radix UI, Tailwind CSS, Lucide Icons |
| **Routing** | React Router v7 |
| **Maps** | Leaflet + React-Leaflet (OpenStreetMap) |
| **Payments** | Razorpay SDK + Serverless API |
| **KYC / Face AI** | face-api.js (browser-side) |
| **Camera** | Browser `getUserMedia` API |
| **Charts** | Recharts |
| **PDF Export** | jsPDF + jspdf-autotable |
| **Backend (Local)** | Node.js + Express |
| **Backend (Production)** | Vercel Serverless Functions |
| **Database** | localStorage (client-side persistence) |
| **Deployment** | Vercel (auto-deploy from GitHub) |

---

## 🖼 Product System

- Products are loaded dynamically from the data layer
- Correct image mapping using static assets in `src/assets/`
- Filename format follows the convention: `ProductName_Category.jpg`
- Auto-extraction of product name and category from the filename
- No incorrect image mismatches — each product maps to its exact image

---

## 🔐 Authentication

- **Email + Password** based login system
- **No Firebase** — authentication is handled locally
- **No OTP verification** — simplified for demo/college project use
- **Role-Based Redirection:**
  - Customers → Customer Home / Dashboard
  - Owners → Owner Dashboard
  - Admin → Admin Dashboard
- **Role Guard** — protected routes prevent unauthorized access

---

## 🧠 Core Functionalities

| Functionality | Description |
|---|---|
| **Role-Based Access Control** | Separate experiences for Customer, Owner, and Admin |
| **CRUD Operations** | Full create, read, update, delete for products and bookings |
| **State-Based Booking System** | Enforced lifecycle with status transitions |
| **Event-Driven Notifications** | Real-time alerts for booking approvals and status changes |
| **Temporary Data Lifecycle** | Camera photos auto-deleted after rental completion |
| **Payment Verification** | Server-side HMAC signature verification |
| **AI Face Matching** | Browser-side neural network face comparison |

---

## ⚠️ Important Constraints

- **Camera feature** works ONLY on the Owner side (during handover confirmation)
- **Feature isolation** — no feature affects or interferes with another
- **No Google Maps API** — all maps use Leaflet with OpenStreetMap tiles
- **No Firebase** — no external authentication or database dependency
- **Test Mode Payments** — Razorpay runs in test mode; no real money is processed
- **Privacy-First KYC** — face matching runs entirely in the browser

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/KAMESH101/GrabnGo.git
cd GrabnGo

# Install frontend dependencies
npm install

# Install server dependencies (for local development)
cd server && npm install && cd ..
```

### Running Locally

```bash
# Start both frontend + backend together
npm run dev:all
```

This runs:
- **Frontend** at `http://127.0.0.1:5173`
- **Backend** at `http://127.0.0.1:3001`

---

## 🔑 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Razorpay Test Keys (safe to use — no real money)
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=your_secret_here
```

> `VITE_` prefix exposes the key to the frontend. The non-prefixed keys are used by serverless API functions.

---

## 🚀 Deployment

The project is deployed on **Vercel** with automatic deployments from GitHub:

1. Push to `main` branch
2. Vercel auto-builds and deploys
3. Serverless functions in `api/` handle payment processing
4. KYC runs entirely in the browser (no backend needed)

### Vercel Environment Variables

Set these in your Vercel project settings:

| Variable | Purpose |
|---|---|
| `VITE_RAZORPAY_KEY_ID` | Frontend Razorpay public key |
| `RAZORPAY_KEY_ID` | Serverless function Razorpay key |
| `RAZORPAY_KEY_SECRET` | Serverless function Razorpay secret |

---

## 📁 Project Structure

```
GrabNGo/
├── api/                        # Vercel Serverless Functions
│   └── payments/
│       ├── create-order.js     # Create Razorpay advance order
│       ├── create-remaining-order.js  # Create remaining payment order
│       └── verify.js           # Verify payment signature
├── server/                     # Local Express backend
│   ├── index.js                # KYC + Payment server
│   ├── kycVerifier.js          # Face-api.js server-side verifier
│   └── models/                 # Face detection model files
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── kyc/            # KYC modal, document upload, camera
│   │   │   ├── shared/         # Navbar, StatusBadge, RoleGuard
│   │   │   ├── customer/       # Customer-specific components
│   │   │   └── owner/          # Owner-specific components
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Signup, ForgotPassword
│   │   │   ├── customer/       # Home, Search, Booking, Dashboard
│   │   │   ├── owner/          # Dashboard, Listings, Bookings
│   │   │   └── admin/          # Dashboard, Management pages
│   │   ├── services/           # Business logic
│   │   │   ├── razorpay.ts     # Payment gateway integration
│   │   │   ├── kyc.ts          # KYC submission service
│   │   │   ├── faceMatching.ts # Browser-side face-api.js
│   │   │   ├── database.ts     # localStorage CRUD operations
│   │   │   └── maps.ts         # Leaflet map utilities
│   │   ├── context/            # React Context (Auth)
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Helpers, seed data, generators
│   └── assets/                 # Product images
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── vercel.json                 # Vercel deployment config
├── vite.config.ts              # Vite build configuration
└── package.json                # Project dependencies
```

---

## 📄 License

This project is developed as a **college project** for educational purposes.

---

<p align="center">
  Built with ❤️ by <strong>KAMESH</strong>
</p>