import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useOwnerData } from '../../hooks/useOwnerData';
import { Navbar } from '../../components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PlusCircle, Package, Calendar, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { KycModal } from '../../components/kyc/KycModal';
import { checkOwnerKycStatus } from '../../services/kyc';
import { toast } from 'sonner';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showKycModal, setShowKycModal] = React.useState(false);

  // Data source: Listings Collection, Bookings Collection
  // Filters: ownerId = loggedInOwner.id
  const { ownerListings, ownerBookings, isLoading } = useOwnerData(user?.id || '');

  // Calculate statistics from owner-specific data
  const stats = {
    totalListings: ownerListings.length,
    activeBookings: ownerBookings.filter((b) => b.status === 'confirmed' || b.status === 'active').length,
    monthlyEarnings: ownerBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0),
    pendingApprovals: ownerBookings.filter((b) => b.status === 'requested' || b.status === 'pending').length,
  };

  // UI State - Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Owner Dashboard</h1>
          <Button
            onClick={() => {
              // KYC CHECK - Block if owner KYC not verified
              if (!user || !checkOwnerKycStatus(user)) {
                toast.error('Please complete Owner KYC to list products');
                setShowKycModal(true);
                return;
              }
              navigate('/owner/create-listing');
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Listing
          </Button>
        </div>

        {/* Stats Cards - Data from ownerListings and ownerBookings */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Listings</p>
                  <p className="text-3xl mt-1">{stats.totalListings}</p>
                </div>
                <Package className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Bookings</p>
                  <p className="text-3xl mt-1">{stats.activeBookings}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-3xl mt-1">₹{stats.monthlyEarnings}</p>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-3xl mt-1">{stats.pendingApprovals}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/bookings')}>
            <CardHeader>
              <CardTitle>Manage Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage all your rental bookings</p>
              <Button variant="link" className="mt-4 p-0">
                View Bookings →
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/manage-listings')}>
            <CardHeader>
              <CardTitle>Manage Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View, edit, and manage your {stats.totalListings} rental listings</p>
              <Button variant="link" className="mt-4 p-0">
                Manage Listings →
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/reports')}>
            <CardHeader>
              <CardTitle>Earnings Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View detailed earnings and download reports</p>
              <Button variant="link" className="mt-4 p-0">
                View Reports →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KYC Modal */}
      <KycModal
        isOpen={showKycModal}
        role="owner"
        onClose={() => setShowKycModal(false)}
        onSuccess={() => {
          setShowKycModal(false);
          toast.success('Owner KYC submitted! Waiting for admin approval.');
        }}
      />
    </div>
  );
};