import image_d911ff19215a0cd722b7643e174559cda5e21b22 from '../../assets/d911ff19215a0cd722b7643e174559cda5e21b22.png';
import image_94de451d9fc4b0339762ad04b304997b5a5a9bd4 from '../../assets/94de451d9fc4b0339762ad04b304997b5a5a9bd4.png';
import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Car, Bike, Camera, Plane, Package, ShieldCheck } from 'lucide-react';
const logo = image_94de451d9fc4b0339762ad04b304997b5a5a9bd4;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const categories = [
    { name: 'Cars', icon: Car, color: 'bg-blue-500' },
    { name: 'Bikes', icon: Bike, color: 'bg-green-500' },
    { name: 'Drones', icon: Plane, color: 'bg-purple-500' },
    { name: 'Cameras', icon: Camera, color: 'bg-pink-500' },
    { name: 'Equipments', icon: Package, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Hero Section */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="GrabNGo" 
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold text-indigo-600">GrabNGo</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Temporary Admin Access Button */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/login')}
                className="text-xs text-gray-400 hover:text-indigo-600"
              >
                <ShieldCheck className="w-4 h-4 mr-1" />
                Admin
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/test-accounts')}
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                🧪 Test Accounts
              </Button>
              <Button variant="ghost" onClick={() => navigate('/customer/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/customer/signup')} className="bg-indigo-600 hover:bg-indigo-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl mb-6">
          Rent Anything,{' '}
          <span className="text-indigo-600">Anytime</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your trusted rental marketplace in Chennai. From cars to cameras, find everything you need.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" onClick={() => navigate('/customer/signup')} className="bg-indigo-600 hover:bg-indigo-700">
            Rent Now
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/owner/signup')} className="border-green-600 text-green-600 hover:bg-green-50">
            List Your Items
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl text-center mb-8">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map(({ name, icon: Icon, color }) => (
            <Card key={name} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/customer/login')}>
              <CardContent className="p-6 text-center">
                <div className={`${color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3>{name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center mb-12">Why Choose GrabNGo?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="mb-2">Secure & Verified</h3>
              <p className="text-gray-600">All owners are KYC verified for your safety</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="mb-2">Location Based</h3>
              <p className="text-gray-600">Find rentals near your locality in Chennai</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mb-2">Best Prices</h3>
              <p className="text-gray-600">Affordable rates with transparent pricing</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-8">Join thousands of happy customers and owners</p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/customer/signup')}>
            Sign Up as Customer
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/owner/signup')}>
            Sign Up as Owner
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[rgb(13,28,12)] text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="bg-white rounded-lg p-2">
              <img 
                src={logo} 
                alt="GrabNGo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-bold">GrabNGo</span>
          </div>
          <p className="text-gray-400">Chennai's Premier Rental Marketplace</p>
          <p className="text-sm text-gray-500 mt-4">© 2025 GrabNGo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};