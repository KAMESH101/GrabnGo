# GrabNGo - Rental Platform

## Overview

GrabNGo is a peer-to-peer rental marketplace built with React and TypeScript, enabling customers to rent vehicles, equipment, and electronics from local owners in Chennai, India. The platform supports three user roles (customer, owner, admin) with distinct workflows including booking management, photo verification at pickup, payment processing via Razorpay, and location-based product discovery using Leaflet maps.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: React Router for navigation with role-based route guards
- **State Management**: React Context API for auth and booking state
- **UI Components**: shadcn/ui (Radix primitives) with Tailwind CSS
- **Maps**: Leaflet with OpenStreetMap tiles for location features

### Data Layer
- **Storage**: localStorage-based database simulation (designed for backend migration)
- **Centralized Database Service**: `src/app/services/database.ts` acts as single source of truth
- **Collections**: Users, Products, Bookings with CRUD operations
- **Seeding**: Auto-seeds demo data on first load via `seedDatabase()`

### User Role System
- **Customer**: Browse products, book rentals, verify location for pickup
- **Owner**: Create listings, manage bookings, capture customer photos at pickup
- **Admin**: Dashboard with user/product/booking management, data consistency checks

### Key Features
- **Location Verification**: GPS-based customer location capture with Chennai locality validation
- **Photo Verification Flow**: Camera capture during rental pickup stored to simulated S3
- **Payment Integration**: Razorpay demo mode for booking payments
- **Notifications**: Mock SMS/Email services for booking confirmations

### Directory Structure
```
src/
├── app/
│   ├── components/     # UI components (shared, customer, owner, admin)
│   ├── context/        # React Context providers (Auth, Booking)
│   ├── data/           # Mock data and Chennai localities
│   ├── hooks/          # Custom hooks (useProducts, useOwnerData, useLocationGuard)
│   ├── pages/          # Route pages organized by role
│   ├── services/       # Business logic (database, bookings, products, maps, razorpay)
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Seed data and mock generators
├── styles/             # Tailwind CSS and theme
└── assets/             # Static images
```

### Design Patterns
- **Service Layer Pattern**: All data operations go through service modules
- **Context-Aware Guards**: Location prompts only appear during rental actions, not browsing
- **Role-Based Routing**: `RoleGuard` component restricts page access by user role

## External Dependencies

### UI Framework
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, forms
- **shadcn/ui**: Pre-styled components built on Radix
- **Tailwind CSS**: Utility-first styling with custom theme variables
- **Lucide React**: Icon library

### Maps & Location
- **Leaflet**: Interactive maps with `react-leaflet` bindings
- **OpenStreetMap**: Free tile layer for map display
- **Custom Geocoding**: Simulated reverse geocoding for Chennai localities

### Payment (Demo Mode)
- **Razorpay**: Test mode integration for booking payments
- Console logging simulates actual API calls

### Notifications (Demo Mode)
- **SMS**: Mock MSG91-style gateway
- **Email**: Mock SendGrid-style service
- All notifications logged to console

### Document Generation
- **jsPDF**: PDF generation for reports and invoices
- **jspdf-autotable**: Table formatting in PDFs

### Date Handling
- **date-fns**: Date formatting and manipulation

### Storage (Demo Mode)
- **Simulated S3**: Mock AWS S3 for photo storage with in-memory Map
- Photos stored as data URLs in demo, designed for real S3 integration