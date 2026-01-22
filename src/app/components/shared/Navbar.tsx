import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { CustomerLeafletLocationModal } from '../customer/CustomerLeafletLocationModal';
import { VerifiedCustomerLocation } from '../../types';
import { Search, User, LogOut, Menu, MapPin } from 'lucide-react';
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLocationChange = async (location: VerifiedCustomerLocation) => {
    await updateCustomerLocation(location);
    setIsLocationModalOpen(false);
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? `/${user.role}/home` : '/'} className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="GrabNGo" 
              className="h-10 w-auto object-contain"
            />
            <span className="text-xl font-bold text-indigo-600">GrabNGo</span>
          </Link>

          {user && user.role === 'customer' && (
            <div className="flex-1 max-w-md mx-4">
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

          <div className="flex items-center gap-2">
            {/* Customer Location Display (Optional - User Controlled) */}
            {user && user.role === 'customer' && user.verifiedLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden md:flex"
              >
                <MapPin className="w-4 h-4 mr-1 text-green-600" />
                <span className="text-sm">{user.verifiedLocation.locality}</span>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/${user.role}/dashboard`)}>
                    Dashboard
                  </DropdownMenuItem>
                  
                  {/* Change Location Option - Customer Only */}
                  {user.role === 'customer' && (
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
        </div>
      </div>

      {/* Location Modal - User Controlled (Optional) */}
      {user && user.role === 'customer' && (
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