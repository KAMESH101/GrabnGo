import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { ShieldCheck, LogOut, LayoutDashboard, Users, Package, ShoppingBag, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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
    { path: '/admin/data-consistency', label: 'Data Check', icon: AlertTriangle },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">GrabNGo Admin</p>
              <p className="text-xs text-gray-500">System Panel</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-gray-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};