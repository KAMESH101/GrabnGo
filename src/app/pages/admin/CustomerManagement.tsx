import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { BackButton } from '../../components/ui/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MapPin, Mail, Phone, Search, CheckCircle, XCircle, UserCheck, Unlock } from 'lucide-react';
import { getAllUsers, updateUser, unlockAccount } from '../../services/database';
import { User } from '../../types';
import { toast } from 'sonner';

export const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDualRole, setFilterDualRole] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadCustomers();
  }, [user, navigate]);

  const loadCustomers = () => {
    const allUsers = getAllUsers();
    // Filter users who have 'customer' in their roles array
    const customerList = allUsers.filter(u => u.roles?.includes('customer'));
    setCustomers(customerList);
  };

  // Apply filters
  let filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    customer.phone.includes(searchQuery)
  );

  // Apply dual-role filter if enabled
  if (filterDualRole) {
    filteredCustomers = filteredCustomers.filter(c => c.roles && c.roles.length > 1);
  }

  const handleToggleStatus = (customerId: string, currentEnabled: boolean) => {
    try {
      // For demo: toggle a custom 'enabled' field
      // In production, this would be part of User type
      updateUser(customerId, {
        // @ts-ignore - Demo field
        enabled: !currentEnabled
      });

      loadCustomers();
      toast.success(currentEnabled ? 'Customer disabled' : 'Customer enabled');
    } catch (error) {
      toast.error('Failed to update customer status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">View and manage customer accounts</p>
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
                  Showing {filteredCustomers.length} dual-role customer{filteredCustomers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold mt-1">{customers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Dual-Role Users</p>
              <p className="text-2xl font-bold mt-1">
                {customers.filter(c => c.roles && c.roles.length > 1).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">KYC Verified</p>
              <p className="text-2xl font-bold mt-1">
                {customers.filter(c => c.customerKycStatus === 'verified').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Phone Verified</p>
              <p className="text-2xl font-bold mt-1">
                {customers.filter(c => c.phoneVerified).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Locked Accounts</p>
              <p className="text-2xl font-bold mt-1">
                {customers.filter(c => c.accountLocked).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
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
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {filterDualRole ? 'No dual-role customers found' : 'No customers found'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {customer.roles?.map((role) => (
                              <span
                                key={role}
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${role === 'customer'
                                  ? 'bg-blue-100 text-blue-700'
                                  : role === 'owner'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                  } ${customer.activeRole === role ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                              >
                                {role}
                                {customer.activeRole === role && ' ⭐'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${customer.customerKycStatus === 'verified'
                                  ? 'bg-green-100 text-green-700'
                                  : customer.customerKycStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : customer.customerKycStatus === 'rejected'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {customer.customerKycStatus || 'none'}
                              </span>
                            </div>
                            {customer.roles?.includes('owner') && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Owner:</span>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${customer.ownerKycStatus === 'verified'
                                    ? 'bg-green-100 text-green-700'
                                    : customer.ownerKycStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : customer.ownerKycStatus === 'rejected'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                  {customer.ownerKycStatus || 'none'}
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
                            {customer.accountLocked && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-3 h-3" />
                                <span>Locked</span>
                                {customer.lockUntil && (
                                  <span className="text-[10px]">
                                    until {new Date(customer.lockUntil).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {customer.verifiedLocation ? (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">
                                  {customer.verifiedLocation.locality}
                                </p>
                                <p className="text-gray-500">
                                  {customer.verifiedLocation.area}, {customer.verifiedLocation.city}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No verified location</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/kyc/customer?userId=${customer.id}`)}
                              className="text-xs"
                            >
                              View Details
                            </Button>

                            {/* Admin Actions */}
                            {customer.accountLocked && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  unlockAccount(customer.id);
                                  loadCustomers();
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