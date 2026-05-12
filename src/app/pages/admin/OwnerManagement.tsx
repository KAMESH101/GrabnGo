import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MapPin, Mail, Phone, Search, Package, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { getAllUsers, getAllProducts } from '../../services/database';
import { User, Product } from '../../types';
import { toast } from 'sonner';

export const OwnerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [owners, setOwners] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDualRole, setFilterDualRole] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    const allUsers = getAllUsers();
    // Filter users who have 'owner' in their roles array
    const ownerList = allUsers.filter(u => u.roles?.includes('owner'));
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

  // Apply filters
  let filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (owner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    owner.phone.includes(searchQuery)
  );

  // Apply dual-role filter if enabled
  if (filterDualRole) {
    filteredOwners = filteredOwners.filter(o => o.roles && o.roles.length > 1);
  }

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
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterDualRole ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDualRole(!filterDualRole)}
                className="text-xs"
              >
                <UserCheck className="w-3 h-3 mr-1" />
                Dual-Role Users Only
              </Button>
              {filterDualRole && (
                <span className="text-xs text-gray-500">
                  Showing {filteredOwners.length} dual-role owner{filteredOwners.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Owners</p>
              <p className="text-2xl font-bold mt-1">{owners.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Dual-Role Users</p>
              <p className="text-2xl font-bold mt-1">
                {owners.filter(o => o.roles && o.roles.length > 1).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">KYC Verified</p>
              <p className="text-2xl font-bold mt-1">
                {owners.filter(o => o.ownerKycStatus === 'verified').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Phone Verified</p>
              <p className="text-2xl font-bold mt-1">
                {owners.filter(o => o.phoneVerified).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Locked Accounts</p>
              <p className="text-2xl font-bold mt-1">
                {owners.filter(o => o.accountLocked).length}
              </p>
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
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      KYC Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Account Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Listings
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
                        {filterDualRole ? 'No dual-role owners found' : 'No owners found'}
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
                            <div className="flex flex-wrap gap-1">
                              {owner.roles?.map((role) => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${role === 'customer'
                                    ? 'bg-blue-100 text-blue-700'
                                    : role === 'owner'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                    } ${owner.activeRole === role ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                                >
                                  {role}
                                  {owner.activeRole === role && ' ⭐'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {owner.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${owner.ownerKycStatus === 'verified'
                                    ? 'bg-green-100 text-green-700'
                                    : owner.ownerKycStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : owner.ownerKycStatus === 'rejected'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                  {owner.ownerKycStatus || 'none'}
                                </span>
                              </div>
                              {owner.roles?.includes('customer') && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Customer:</span>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${owner.customerKycStatus === 'verified'
                                      ? 'bg-green-100 text-green-700'
                                      : owner.customerKycStatus === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : owner.customerKycStatus === 'rejected'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}
                                  >
                                    {owner.customerKycStatus || 'none'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              {/* Account Status */}
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-green-600">Active</span>
                              </div>

                              {/* Account Lock Status */}
                              {owner.accountLocked && (
                                <div className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-3 h-3" />
                                  <span>Locked</span>
                                  {owner.lockUntil && (
                                    <span className="text-[10px]">
                                      until {new Date(owner.lockUntil).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                              )}
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
                            {locations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {locations.slice(0, 2).map((loc, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {loc}
                                  </span>
                                ))}
                                {locations.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{locations.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/kyc/owner?userId=${owner.id}`)}
                                className="text-xs"
                              >
                                View Details
                              </Button>

                              {/* Admin Actions */}
                              {owner.accountLocked && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    unlockAccount(owner.id);
                                    loadData();
                                    toast.success('Account unlocked successfully');
                                  }}
                                  className="text-xs text-green-600 hover:text-green-700"
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unlock
                                </Button>
                              )}
                            </div>
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
    </div >
  );
};
