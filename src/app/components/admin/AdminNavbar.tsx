import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { ShieldCheck, LogOut, LayoutDashboard, Users, Package, ShoppingBag, MapPin, AlertTriangle, Camera, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/'); // Redirect to home page instead of admin login
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/mock-account-creation', label: 'Mock Accounts', icon: Users },
    { path: '/admin/users/customers', label: 'Customers', icon: Users },
    { path: '/admin/users/owners', label: 'Owners', icon: Users },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/bookings', label: 'Bookings', icon: ShoppingBag },
    { path: '/admin/locations', label: 'Locations', icon: MapPin },
    { path: '/admin/photos', label: 'Photos', icon: Camera },
    { path: '/admin/data-consistency', label: 'Data Check', icon: AlertTriangle },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm sm:text-base">GrabNGo Admin</p>
              <p className="text-xs text-gray-500 hidden sm:block">System Panel</p>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right side: Logout + Mobile Hamburger */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-600"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle admin menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-lg">
          <div className="px-4 py-2 grid grid-cols-2 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`px-3 py-3 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};