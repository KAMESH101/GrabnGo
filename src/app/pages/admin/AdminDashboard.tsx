import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Store, Package, ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import {
  getAllUsers,
  getAllProducts,
  getAllBookings,
} from '../../services/database';
import { User, Product, Booking } from '../../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    // Load all data
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    const allUsers = getAllUsers();
    const allProducts = getAllProducts();
    const allBookings = getAllBookings();

    setUsers(allUsers);
    setProducts(allProducts);
    setBookings(allBookings);
  };

  // Calculate statistics
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalOwners = users.filter(u => u.role === 'owner').length;
  const totalProducts = products.length;
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => 
    b.status === 'active' || b.status === 'confirmed'
  ).length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const stats = [
    {
      title: 'Total Customers',
      value: totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Total Owners',
      value: totalOwners,
      icon: Store,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: ShoppingBag,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      title: 'Active Bookings',
      value: activeBookings,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Completed Bookings',
      value: completedBookings,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System maintenance and data validation
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users/customers')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <Users className="w-5 h-5 text-indigo-600 mb-2" />
            <p className="font-medium">Manage Customers</p>
            <p className="text-sm text-gray-500 mt-1">{totalCustomers} total</p>
          </button>

          <button
            onClick={() => navigate('/admin/users/owners')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <Store className="w-5 h-5 text-green-600 mb-2" />
            <p className="font-medium">Manage Owners</p>
            <p className="text-sm text-gray-500 mt-1">{totalOwners} total</p>
          </button>

          <button
            onClick={() => navigate('/admin/products')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <Package className="w-5 h-5 text-purple-600 mb-2" />
            <p className="font-medium">Manage Products</p>
            <p className="text-sm text-gray-500 mt-1">{totalProducts} listings</p>
          </button>

          <button
            onClick={() => navigate('/admin/bookings')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <ShoppingBag className="w-5 h-5 text-indigo-600 mb-2" />
            <p className="font-medium">Manage Bookings</p>
            <p className="text-sm text-gray-500 mt-1">{totalBookings} total</p>
          </button>
        </div>
      </div>
    </div>
  );
};
