import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { BackButton } from '../../components/ui/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MapPin, Mail, Phone, Search, CheckCircle, XCircle } from 'lucide-react';
import { getAllUsers, updateUser } from '../../services/database';
import { User } from '../../types';
import { toast } from 'sonner';

export const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadCustomers();
  }, [user, navigate]);

  const loadCustomers = () => {
    const allUsers = getAllUsers();
    const customerList = allUsers.filter(u => u.role === 'customer');
    setCustomers(customerList);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

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
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold mt-1">{customers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">With Verified Location</p>
              <p className="text-2xl font-bold mt-1">
                {customers.filter(c => c.verifiedLocation).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Search Results</p>
              <p className="text-2xl font-bold mt-1">{filteredCustomers.length}</p>
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
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
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No customers found
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
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
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
                                <p className="text-xs text-gray-400 mt-1">
                                  Verified: {new Date(customer.verifiedLocation.verifiedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No verified location</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {customer.id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(customer.id, true)}
                            className="text-xs"
                          >
                            Disable
                          </Button>
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