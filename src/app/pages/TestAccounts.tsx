import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, ShieldCheck, Users, Store, ArrowLeft, LogIn, RefreshCw, Trash2, Database, AlertCircle } from 'lucide-react';
import { getAllUsers, getAllBookings } from '../services/database';
import { User as UserType } from '../types';
import { toast } from 'sonner';
import { clearDatabase, seedDatabase } from '../utils/seedData';
import logo from '../../assets/94de451d9fc4b0339762ad04b304997b5a5a9bd4.png';

interface TestAccount {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'owner' | 'admin';
  description: string;
  locality?: string;
}

export const TestAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mockAccounts, setMockAccounts] = useState<UserType[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Pre-seeded accounts
  const seededAccounts: TestAccount[] = [
    {
      name: 'Admin User',
      email: 'admin@grabngo.com',
      password: 'admin123',
      role: 'admin',
      description: 'Full admin access - manage users, products, bookings',
    },
    {
      name: 'Rajesh Kumar',
      email: 'rajesh@grabngo.com',
      password: 'owner123',
      role: 'owner',
      description: 'Owner with 3 active listings (Car, Bike, DJ Equipment)',
      locality: 'T Nagar',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@grabngo.com',
      password: 'owner123',
      role: 'owner',
      description: 'Owner with 2 active listings (Drone, Camera)',
      locality: 'Adyar',
    },
  ];

  useEffect(() => {
    loadMockAccounts();
  }, []);

  const loadMockAccounts = () => {
    setLoadingAccounts(true);
    try {
      const users = getAllUsers();
      const mock = users.filter(u => 
        u.id.startsWith('mock_customer_') || u.id.startsWith('mock_owner_')
      );
      setMockAccounts(mock);
    } catch (error) {
      console.error('Failed to load mock accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    setIsLoggingIn(true);
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success(`Logged in as ${role}`);
        
        // Navigate based on role
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'owner') {
          navigate('/owner/dashboard');
        } else if (role === 'customer') {
          navigate('/customer/home');
        }
      } else {
        toast.error('Login failed - please check credentials');
      }
    } catch (error) {
      toast.error('Login error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMockAccountLogin = async (mockUser: UserType) => {
    setIsLoggingIn(true);
    try {
      // All mock accounts use 'mock123' as password
      const success = await login(mockUser.email, 'mock123');
      
      if (success) {
        toast.success(`Logged in as ${mockUser.name}`);
        
        if (mockUser.role === 'customer') {
          navigate('/customer/home');
        } else if (mockUser.role === 'owner') {
          navigate('/owner/dashboard');
        }
      } else {
        toast.error('Login failed');
      }
    } catch (error) {
      toast.error('Login error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'owner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'customer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-5 h-5" />;
      case 'owner':
        return <Store className="w-5 h-5" />;
      case 'customer':
        return <Users className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('⚠️ This will delete ALL data (users, products, bookings). Continue?')) {
      return;
    }

    try {
      clearDatabase();
      toast.success('Database cleared successfully');
      loadMockAccounts();
      
      // Reload the page to trigger seed data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Failed to clear database');
    }
  };

  const handleSeedDatabase = async () => {
    try {
      seedDatabase();
      toast.success('Database seeded successfully');
      loadMockAccounts();
    } catch (error) {
      toast.error('Failed to seed database');
    }
  };

  const handleClearAndReseed = async () => {
    if (!window.confirm('⚠️ This will RESET the entire database with fresh sample data. All existing data will be lost. Continue?')) {
      return;
    }

    try {
      clearDatabase();
      toast.info('Database cleared...');
      
      // Give a small delay
      setTimeout(() => {
        seedDatabase();
        toast.success('✅ Database reset successfully! Fresh sample data loaded.');
        loadMockAccounts();
        
        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 500);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset database');
    }
  };

  const handleForceReseedBookings = async () => {
    if (!window.confirm('⚠️ This will RESET the bookings data with fresh sample data. All existing bookings will be lost. Continue?')) {
      return;
    }

    try {
      forceReseedBookings();
      toast.success('Bookings data reset successfully! Fresh sample data loaded.');
      loadMockAccounts();
      
      // Reload the page to trigger seed data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Failed to reset bookings data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="GrabNGo" 
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold text-indigo-600">GrabNGo</span>
              <span className="ml-2 text-sm text-gray-500">Test Accounts</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🧪 Test Accounts
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quick access to all demo accounts for testing GrabNGo features. Click any account to log in instantly!
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Developer Testing Environment</p>
                <p>All passwords are shown below for easy testing. In production, you would use proper authentication flows.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seeded Accounts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            Pre-seeded Accounts
          </h2>
          <p className="text-gray-600 mb-4">These accounts are automatically created when the app starts</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seededAccounts.map((account) => (
              <Card key={account.email} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${
                      account.role === 'admin' ? 'bg-indigo-100' :
                      account.role === 'owner' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {getRoleIcon(account.role)}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(account.role)}`}>
                      {account.role.toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  {account.locality && (
                    <p className="text-xs text-gray-500">📍 {account.locality}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{account.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-mono text-gray-900">{account.email}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Password</p>
                      <p className="text-sm font-mono text-gray-900">{account.password}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleQuickLogin(account.email, account.password, account.role)}
                    disabled={isLoggingIn}
                    className={`w-full ${
                      account.role === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700' :
                      account.role === 'owner' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {isLoggingIn ? 'Logging in...' : 'Quick Login'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mock Accounts Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                Mock Accounts
              </h2>
              <p className="text-gray-600 mt-1">
                {mockAccounts.length > 0 
                  ? `${mockAccounts.length} mock accounts created via Admin panel`
                  : 'No mock accounts created yet. Use Admin panel to create mock accounts.'}
              </p>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMockAccounts}
                disabled={loadingAccounts}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingAccounts ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDatabase}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Database
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDatabase}
              >
                <Database className="w-4 h-4 mr-2" />
                Seed Database
              </Button>
            </div>
          </div>

          {mockAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-500 mb-4">No mock accounts found</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/login')}
                  className="mx-auto"
                >
                  Go to Admin Panel to Create Mock Accounts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAccounts.map((account) => (
                <Card key={account.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${
                        account.role === 'owner' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {getRoleIcon(account.role)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(account.role)}`}>
                        {account.role.toUpperCase()}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    {(account.verifiedLocation?.locality || account.locality) && (
                      <p className="text-xs text-gray-500">
                        📍 {account.verifiedLocation?.locality || account.locality}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-mono text-gray-900 truncate">{account.email}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Password</p>
                        <p className="text-sm font-mono text-gray-900">mock123</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleMockAccountLogin(account)}
                      disabled={isLoggingIn}
                      className={`w-full ${
                        account.role === 'owner' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {isLoggingIn ? 'Logging in...' : 'Quick Login'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <Card className="mt-8 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg">How to Use Test Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-indigo-900">
              <div>
                <p className="font-medium mb-1">🔑 Quick Login</p>
                <p>Click "Quick Login" on any account card to instantly log in and test that role's features</p>
              </div>
              <div>
                <p className="font-medium mb-1">👤 Test Customer Flow</p>
                <p>Use customer accounts to browse products, make bookings, and test the rental process</p>
              </div>
              <div>
                <p className="font-medium mb-1">🏪 Test Owner Flow</p>
                <p>Use owner accounts to create listings, manage bookings, and verify customer photos at pickup</p>
              </div>
              <div>
                <p className="font-medium mb-1">🛡️ Test Admin Flow</p>
                <p>Use the admin account to manage all users, products, bookings, and monitor system data</p>
              </div>
              <div>
                <p className="font-medium mb-1">🤖 Create More Mock Accounts</p>
                <p>Log in as admin and visit "Mock Account Creation" to generate additional test accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};