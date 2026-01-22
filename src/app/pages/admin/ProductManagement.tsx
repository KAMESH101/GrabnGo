import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MapPin, Search, User, CheckCircle, XCircle } from 'lucide-react';
import { getAllProducts, updateProduct } from '../../services/database';
import { Product } from '../../types';
import { toast } from 'sonner';

export const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const ownerFilter = searchParams.get('owner');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [user, navigate]);

  const loadProducts = () => {
    const allProducts = getAllProducts();
    setProducts(allProducts);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.pickupLocality.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOwner = ownerFilter ? product.ownerId === ownerFilter : true;
    
    return matchesSearch && matchesOwner;
  });

  const handleToggleAvailability = (productId: string, currentAvailability: boolean) => {
    try {
      updateProduct(productId, { availability: !currentAvailability });
      loadProducts();
      toast.success(currentAvailability ? 'Product disabled' : 'Product enabled');
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">View and manage product listings</p>
          {ownerFilter && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtered by owner:</span>
              <code className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                {ownerFilter}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/admin/products')}
                className="text-xs"
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title, category, owner, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold mt-1">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {products.filter(p => p.availability).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Disabled</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {products.filter(p => !p.availability).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Search Results</p>
              <p className="text-2xl font-bold mt-1">{filteredProducts.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Product Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pickup Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{product.title}</p>
                              <code className="text-xs text-gray-400">{product.id}</code>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{product.ownerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">
                                {product.pickupLocality}
                              </p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                {product.pickupAddress}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              ₹{product.pricePerDay}/day
                            </p>
                            <p className="text-xs text-gray-500">
                              Deposit: ₹{product.deposit}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.availability ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                              <XCircle className="w-3 h-3" />
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={product.availability ? 'outline' : 'default'}
                              onClick={() => handleToggleAvailability(product.id, product.availability)}
                              className="text-xs"
                            >
                              {product.availability ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
