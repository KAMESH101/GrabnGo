import React, { useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { Toaster } from './components/ui/sonner';
import { initializeDatabase } from './services/database';
import { seedDatabase } from './utils/seedData';
import { fixCorruptedBookings } from './utils/mockDataGenerator';
import './leaflet-styles';

// Landing Page
import { LandingPage } from './pages/LandingPage';
import { TestAccounts } from './pages/TestAccounts';

// Auth Pages
import { CustomerLogin } from './pages/auth/CustomerLogin';
import { CustomerSignup } from './pages/auth/CustomerSignup';
import { OwnerLogin } from './pages/auth/OwnerLogin';
import { OwnerSignup } from './pages/auth/OwnerSignup';
import { AdminLogin } from './pages/admin/AdminLogin';

// Customer Pages
import { CustomerHome } from './pages/customer/CustomerHome';
import { SearchPage } from './pages/customer/SearchPage';
import { ProductDetail } from './pages/customer/ProductDetail';
import { BookingPage } from './pages/customer/BookingPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerBookingDetails } from './pages/customer/CustomerBookingDetails';

// Owner Pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { CreateListing } from './pages/owner/CreateListing';
import { ManageListings } from './pages/owner/ManageListings';
import { Reports } from './pages/owner/Reports';
import { BookingManagement } from './pages/owner/BookingManagement';
import { PhotoVerification } from './pages/owner/PhotoVerification';
import { BookingDetails } from './pages/owner/BookingDetails';
import { EditListing } from './pages/owner/EditListing';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTest } from './pages/admin/AdminTest';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { OwnerManagement } from './pages/admin/OwnerManagement';
import { ProductManagement } from './pages/admin/ProductManagement';
import { AdminBookingManagement } from './pages/admin/BookingManagement';
import { LocationMonitoring } from './pages/admin/LocationMonitoring';
import { DataConsistency } from './pages/admin/DataConsistency';
import { MockAccountCreation } from './pages/admin/MockAccountCreation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    } else {
      return <Navigate to="/customer/home" replace />;
    }
  }

  return <>{children}</>;
};

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/test-accounts',
    element: <TestAccounts />,
  },
  // Customer Auth
  {
    path: '/customer/login',
    element: <CustomerLogin />,
  },
  {
    path: '/customer/signup',
    element: <CustomerSignup />,
  },
  // Owner Auth
  {
    path: '/owner/login',
    element: <OwnerLogin />,
  },
  {
    path: '/owner/signup',
    element: <OwnerSignup />,
  },
  // Admin Auth
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  // Customer Routes
  {
    path: '/customer/home',
    element: <ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>,
  },
  {
    path: '/customer/search',
    element: <ProtectedRoute allowedRoles={['customer']}><SearchPage /></ProtectedRoute>,
  },
  {
    path: '/customer/product/:id',
    element: <ProtectedRoute allowedRoles={['customer']}><ProductDetail /></ProtectedRoute>,
  },
  {
    path: '/customer/booking/:id',
    element: <ProtectedRoute allowedRoles={['customer']}><BookingPage /></ProtectedRoute>,
  },
  {
    path: '/customer/dashboard',
    element: <ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>,
  },
  {
    path: '/customer/booking-details/:bookingId',
    element: <ProtectedRoute allowedRoles={['customer']}><CustomerBookingDetails /></ProtectedRoute>,
  },
  // Owner Routes
  {
    path: '/owner/home',
    element: <ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>,
  },
  {
    path: '/owner/dashboard',
    element: <ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>,
  },
  {
    path: '/owner/create-listing',
    element: <ProtectedRoute allowedRoles={['owner']}><CreateListing /></ProtectedRoute>,
  },
  {
    path: '/owner/manage-listings',
    element: <ProtectedRoute allowedRoles={['owner']}><ManageListings /></ProtectedRoute>,
  },
  {
    path: '/owner/reports',
    element: <ProtectedRoute allowedRoles={['owner']}><Reports /></ProtectedRoute>,
  },
  {
    path: '/owner/bookings',
    element: <ProtectedRoute allowedRoles={['owner']}><BookingManagement /></ProtectedRoute>,
  },
  {
    path: '/owner/verify/:bookingId',
    element: <ProtectedRoute allowedRoles={['owner']}><PhotoVerification /></ProtectedRoute>,
  },
  {
    path: '/owner/booking/:bookingId',
    element: <ProtectedRoute allowedRoles={['owner']}><BookingDetails /></ProtectedRoute>,
  },
  {
    path: '/owner/edit-listing/:listingId',
    element: <ProtectedRoute allowedRoles={['owner']}><EditListing /></ProtectedRoute>,
  },
  // Admin Routes
  {
    path: '/admin/home',
    element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin/users/customers',
    element: <ProtectedRoute allowedRoles={['admin']}><CustomerManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/users/owners',
    element: <ProtectedRoute allowedRoles={['admin']}><OwnerManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/products',
    element: <ProtectedRoute allowedRoles={['admin']}><ProductManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/bookings',
    element: <ProtectedRoute allowedRoles={['admin']}><AdminBookingManagement /></ProtectedRoute>,
  },
  {
    path: '/admin/locations',
    element: <ProtectedRoute allowedRoles={['admin']}><LocationMonitoring /></ProtectedRoute>,
  },
  {
    path: '/admin/data-consistency',
    element: <ProtectedRoute allowedRoles={['admin']}><DataConsistency /></ProtectedRoute>,
  },
  {
    path: '/admin/mock-account-creation',
    element: <ProtectedRoute allowedRoles={['admin']}><MockAccountCreation /></ProtectedRoute>,
  },
  {
    path: '/admin/test',
    element: <ProtectedRoute allowedRoles={['admin']}><AdminTest /></ProtectedRoute>,
  },
]);

function AppContent() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('grabngo_initialized');
    
    if (!hasInitialized) {
      console.log('🚀 [APP] First initialization in this session');
      fixCorruptedBookings(true);
      initializeDatabase();
      seedDatabase();
      sessionStorage.setItem('grabngo_initialized', 'true');
    } else {
      console.log('✅ [APP] Already initialized in this session, skipping seed');
    }
  }, []);

  return (
    <AuthProvider>
      <BookingProvider>
        <AppContent />
      </BookingProvider>
    </AuthProvider>
  );
}
