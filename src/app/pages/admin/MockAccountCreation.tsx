import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Users, Store, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { 
  createMockCustomers, 
  createMockOwners, 
  getMockAccountStats,
  deleteAllMockAccounts,
  fixCorruptedBookings
} from '../../utils/mockDataGenerator';
import { getAllUsers } from '../../services/database';
import { User } from '../../types';
import { toast } from 'sonner';

export const MockAccountCreation: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [stats, setStats] = useState({ mockCustomers: 0, mockOwners: 0, totalMock: 0 });
  const [customerCount, setCustomerCount] = useState(10);
  const [ownerCount, setOwnerCount] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [mockAccounts, setMockAccounts] = useState<User[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadStats();
    loadMockAccounts();
  }, [user, navigate]);

  const loadStats = () => {
    const currentStats = getMockAccountStats();
    setStats(currentStats);
  };

  const loadMockAccounts = () => {
    const users = getAllUsers();
    const mock = users.filter(u => 
      u.id.startsWith('mock_customer_') || u.id.startsWith('mock_owner_')
    );
    setMockAccounts(mock);
  };

  const handleCreateCustomers = () => {
    if (customerCount < 1 || customerCount > 50) {
      toast.error('Please enter a count between 1 and 50');
      return;
    }

    setIsCreating(true);
    try {
      createMockCustomers(customerCount);
      toast.success(`Created ${customerCount} mock customers`);
      loadStats();
      loadMockAccounts();
    } catch (error) {
      toast.error('Failed to create mock customers');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateOwners = () => {
    if (ownerCount < 1 || ownerCount > 20) {
      toast.error('Please enter a count between 1 and 20');
      return;
    }

    setIsCreating(true);
    try {
      createMockOwners(ownerCount);
      toast.success(`Created ${ownerCount} mock owners`);
      loadStats();
      loadMockAccounts();
    } catch (error) {
      toast.error('Failed to create mock owners');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAllMock = () => {
    if (!confirm('Are you sure you want to delete ALL mock accounts? This cannot be undone.')) {
      return;
    }

    try {
      deleteAllMockAccounts();
      toast.success('All mock accounts deleted');
      loadStats();
      loadMockAccounts();
    } catch (error) {
      toast.error('Failed to delete mock accounts');
    }
  };

  const handleFixCorruptedBookings = () => {
    try {
      const result = fixCorruptedBookings();
      
      if (result.removed === 0 && result.fixed === 0) {
        toast.success('✅ No corrupted bookings found - database is clean!');
      } else {
        toast.success(
          `🔧 Database cleaned! Removed: ${result.removed}, Fixed: ${result.fixed}`
        );
      }
      
      loadStats();
      loadMockAccounts();
    } catch (error) {
      toast.error('Failed to fix corrupted bookings');
    }
  };

  const handleImpersonate = async (mockUser: User) => {
    if (!confirm(`Impersonate ${mockUser.name} (${mockUser.role})?\n\nYou will be logged in as this user for testing.`)) {
      return;
    }

    try {
      // Simple impersonation: use email with a known password
      // In this demo, we'll use the email directly
      const success = await login(mockUser.email, 'mock123');
      
      if (success) {
        toast.success(`Now logged in as ${mockUser.name}`);
        
        // Navigate based on role
        if (mockUser.role === 'customer') {
          navigate('/customer/home');
        } else if (mockUser.role === 'owner') {
          navigate('/owner/home');
        }
      } else {
        toast.error('Failed to impersonate user');
      }
    } catch (error) {
      toast.error('Impersonation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mock Account Creation</h1>
          <p className="text-gray-600 mt-1">Generate mock accounts for testing workflows</p>
        </div>

        {/* Info Alert */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Developer Testing Tool</p>
                <p>Mock accounts are stored in the same database as real users and persist across refresh. Use impersonation to test customer/owner workflows without exposing passwords.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mock Customers</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{stats.mockCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mock Owners</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.mockOwners}</p>
                </div>
                <Store className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Mock Accounts</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalMock}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Creation Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Create Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Create Mock Customers
              </CardTitle>
              <CardDescription>
                Generate customer accounts with verified Chennai locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerCount">Number of Customers (1-50)</Label>
                  <Input
                    id="customerCount"
                    type="number"
                    min="1"
                    max="50"
                    value={customerCount}
                    onChange={(e) => setCustomerCount(parseInt(e.target.value) || 10)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreateCustomers}
                  disabled={isCreating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? 'Creating...' : `Create ${customerCount} Customers`}
                </Button>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Random Indian names</p>
                  <p>• Verified Chennai locations (GPS)</p>
                  <p>• Unique emails & phone numbers</p>
                  <p>• Ready to make bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Owners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-600" />
                Create Mock Owners
              </CardTitle>
              <CardDescription>
                Generate owner accounts with shop names and KYC data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ownerCount">Number of Owners (1-20)</Label>
                  <Input
                    id="ownerCount"
                    type="number"
                    min="1"
                    max="20"
                    value={ownerCount}
                    onChange={(e) => setOwnerCount(parseInt(e.target.value) || 5)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreateOwners}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? 'Creating...' : `Create ${ownerCount} Owners`}
                </Button>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Shop names with owner names</p>
                  <p>• Mock KYC documents</p>
                  <p>• Chennai pickup locations</p>
                  <p>• Ready to add listings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mock Accounts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mock Accounts ({mockAccounts.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFixCorruptedBookings}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fix Corrupted Data
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    loadStats();
                    loadMockAccounts();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                {stats.totalMock > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteAllMock}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Mock
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {mockAccounts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No mock accounts created yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
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
                    {mockAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <code className="text-xs text-gray-400">{account.id}</code>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {account.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {account.phone}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            account.role === 'customer'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {account.verifiedLocation?.locality || account.locality || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImpersonate(account)}
                            className="text-xs"
                          >
                            Impersonate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="mt-6 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg">How to Use Mock Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-indigo-900">
              <li><strong>1. Create mock accounts</strong> - Use the buttons above to generate customers and owners</li>
              <li><strong>2. Impersonate accounts</strong> - Click "Impersonate" to log in as that user</li>
              <li><strong>3. Test workflows</strong>:
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• As Customer: Browse products, make bookings</li>
                  <li>• As Owner: Create listings, manage bookings</li>
                </ul>
              </li>
              <li><strong>4. Return to admin</strong> - Log out and log back in as admin@grabngo.com</li>
              <li><strong>5. Monitor data</strong> - Use admin pages to verify integration</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};