import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MapPin, Mail, Phone, Search, Package } from 'lucide-react';
import { getAllUsers, getAllProducts } from '../../services/database';
import { User, Product } from '../../types';
import { toast } from 'sonner';

export const OwnerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [owners, setOwners] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    const allUsers = getAllUsers();
    const ownerList = allUsers.filter(u => u.role === 'owner');
    setOwners(ownerList);
    setProducts(getAllProducts());
  };

  const getOwnerListings = (ownerId: string) => {
    return products.filter(p => p.ownerId === ownerId);
  };

  const getOwnerLocations = (ownerId: string) => {
    const listings = getOwnerListings(ownerId);
    const uniqueLocalities = [...new Set(listings.map(p => p.pickupLocality))];
    return uniqueLocalities;
  };

  const filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Owner Management</h1>
          <p className="text-gray-600 mt-1">View and manage owner accounts</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Owners</p>
              <p className="text-2xl font-bold mt-1">{owners.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold mt-1">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Search Results</p>
              <p className="text-2xl font-bold mt-1">{filteredOwners.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Owner Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Listings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pickup Locations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOwners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No owners found
                      </td>
                    </tr>
                  ) : (
                    filteredOwners.map((owner) => {
                      const listings = getOwnerListings(owner.id);
                      const locations = getOwnerLocations(owner.id);
                      
                      return (
                        <tr key={owner.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{owner.name}</p>
                              <p className="text-sm text-gray-500">{owner.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {owner.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-gray-900">
                                {listings.length}
                              </span>
                              <span className="text-sm text-gray-500">products</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {locations.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {locations.map((loc, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {loc}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No listings</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {owner.id}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/products?owner=${owner.id}`)}
                              className="text-xs"
                            >
                              View Listings
                            </Button>
                          </td>
                        </tr>
                      );
                    })
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
