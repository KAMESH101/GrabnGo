import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/shared/Navbar';
import { CustomerLeafletLocationModal } from '../../components/customer/CustomerLeafletLocationModal';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Category, Product, VerifiedCustomerLocation } from '../../types';
import { getAvailableProducts, getNearbyProducts } from '../../services/products';
import { Car, Bike, Camera, Plane, Package, MapPin, Navigation, Loader2 } from 'lucide-react';
import logo from '../../../assets/94de451d9fc4b0339762ad04b304997b5a5a9bd4.png';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateCustomerLocation } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let fetchedProducts: Product[] = [];

        // If user has verified location, fetch nearby products sorted by distance
        if (user?.verifiedLocation) {
          console.log('🔍 [CUSTOMER HOME] Fetching nearby products for:', user.verifiedLocation.locality);
          fetchedProducts = await getNearbyProducts(
            user.verifiedLocation.lat,
            user.verifiedLocation.lng,
            50 // 50km radius
          );
        } else {
          // Otherwise fetch all available products
          console.log('🔍 [CUSTOMER HOME] Fetching all available products');
          fetchedProducts = await getAvailableProducts();
        }

        setProducts(fetchedProducts);
        console.log('✅ [CUSTOMER HOME] Products loaded:', fetchedProducts.length);
      } catch (error) {
        console.error('❌ [CUSTOMER HOME] Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user?.verifiedLocation]);

  const handleChangeLocation = () => {
    setIsLocationModalOpen(true);
  };

  const handleLocationConfirmed = async (location: VerifiedCustomerLocation) => {
    await updateCustomerLocation(location);
    setIsLocationModalOpen(false);
  };

  const categories = [
    { name: 'Cars', icon: Car, color: 'bg-blue-500' },
    { name: 'Bikes', icon: Bike, color: 'bg-green-500' },
    { name: 'Drones', icon: Plane, color: 'bg-purple-500' },
    { name: 'Cameras', icon: Camera, color: 'bg-pink-500' },
    { name: 'Equipments', icon: Package, color: 'bg-orange-500' },
  ];

  // Filter products by category
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const featuredProducts = filteredProducts.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl mb-4">Find Your Perfect Rental</h1>
          <p className="text-blue-100 mb-6">Browse thousands of items available near you</p>
          
          {/* Current Location Display (if set) */}
          {user?.verifiedLocation && (
            <div className="bg-white rounded-lg p-4 max-w-md shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Your Location</p>
                    <p className="text-gray-900 font-medium">{user.verifiedLocation.locality}</p>
                    <p className="text-sm text-gray-600">{user.verifiedLocation.area}, {user.verifiedLocation.city}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleChangeLocation}
                  className="flex-shrink-0"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Location Prompt (if not set) */}
          {!user?.verifiedLocation && (
            <div className="bg-white rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <Navigation className="w-5 h-5 text-indigo-600" />
                <p className="text-gray-700 font-medium">Set your location to view nearby rentals</p>
              </div>
              <Button
                onClick={handleChangeLocation}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Select Location
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(({ name, icon: Icon, color }) => (
              <Card
                key={name}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/customer/search?category=${name}`)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`${color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3>{name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Rentals */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl">Featured Rentals</h2>
            <Button variant="link" onClick={() => navigate('/customer/search')}>
              View All →
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            ) : (
              featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => navigate(`/customer/product/${product.id}`)}
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-1">{product.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      {product.pickupLocality}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl text-indigo-600">₹{product.pricePerDay}</span>
                        <span className="text-sm text-gray-500">/day</span>
                      </div>
                      <Button size="sm">View</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-indigo-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white rounded-lg p-2">
                <img src={logo} alt="GrabNGo Logo" className="h-10 w-auto object-contain" />
              </div>
              <span className="text-2xl font-semibold">GrabNGo</span>
            </div>
            <p className="text-indigo-200 text-center">
              Chennai's trusted rental marketplace
            </p>
            <p className="text-indigo-300 text-sm mt-2">
              © 2026 GrabNGo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Location Modal */}
      <CustomerLeafletLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationConfirmed={handleLocationConfirmed}
        currentLocation={user?.verifiedLocation}
      />
    </div>
  );
};