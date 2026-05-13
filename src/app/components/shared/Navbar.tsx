import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { CustomerLeafletLocationModal } from '../customer/CustomerLeafletLocationModal';
import { RoleSwitcher } from './RoleSwitcher';
import { VerifiedCustomerLocation } from '../../types';
import { Search, User, LogOut, Menu, X, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import logo from '../../../assets/94de451d9fc4b0339762ad04b304997b5a5a9bd4.png';

export const Navbar: React.FC = () => {
  const { user, logout, updateCustomerLocation } = useAuth();
  const navigate = useNavigate();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleLocationChange = async (location: VerifiedCustomerLocation) => {
    await updateCustomerLocation(location);
    setIsLocationModalOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? `/${user.activeRole}/home` : '/'} className="flex items-center gap-2 flex-shrink-0">
            <img
              src={logo}
              alt="GrabNGo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <span className="text-lg sm:text-xl font-bold text-indigo-600">GrabNGo</span>
          </Link>

          {/* Search Bar — hidden on mobile */}
          {user && user.activeRole === 'customer' && (
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search rentals..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  onClick={() => navigate('/customer/search')}
                />
              </div>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <RoleSwitcher />

            {user && user.activeRole === 'customer' && user.verifiedLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <MapPin className="w-4 h-4 mr-1 text-green-600" />
                <span className="text-sm max-w-[120px] truncate">{user.verifiedLocation.locality}</span>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/${user.activeRole}/profile`)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/${user.activeRole}/dashboard`)}>
                    Dashboard
                  </DropdownMenuItem>
                  {user.activeRole === 'customer' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsLocationModalOpen(true)}>
                        <MapPin className="w-4 h-4 mr-2" />
                        {user.verifiedLocation ? 'Change Location' : 'Set Location'}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/customer/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/customer/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {/* Mobile Search */}
            {user && user.activeRole === 'customer' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search rentals..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-base"
                  onClick={() => handleNavigate('/customer/search')}
                />
              </div>
            )}

            {/* Location (mobile) */}
            {user && user.activeRole === 'customer' && user.verifiedLocation && (
              <button
                onClick={() => { setIsLocationModalOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 text-left"
              >
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800 truncate">{user.verifiedLocation.locality}</span>
              </button>
            )}

            {/* Role Switcher */}
            <div className="px-1">
              <RoleSwitcher />
            </div>

            {user ? (
              <>
                <button
                  onClick={() => handleNavigate(`/${user.activeRole}/profile`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-left"
                >
                  <User className="w-5 h-5 text-gray-500" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => handleNavigate(`/${user.activeRole}/dashboard`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-left"
                >
                  <span className="ml-8">Dashboard</span>
                </button>
                {user.activeRole === 'customer' && (
                  <button
                    onClick={() => { setIsLocationModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span>{user.verifiedLocation ? 'Change Location' : 'Set Location'}</span>
                  </button>
                )}
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Button className="w-full" variant="outline" onClick={() => handleNavigate('/customer/login')}>
                  Login
                </Button>
                <Button className="w-full" onClick={() => handleNavigate('/customer/signup')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Modal - User Controlled (Optional) */}
      {user && user.activeRole === 'customer' && (
        <CustomerLeafletLocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onLocationConfirmed={handleLocationChange}
          currentLocation={user.verifiedLocation}
        />
      )}
    </nav>
  );
};