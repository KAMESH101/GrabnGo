import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, User, Package } from 'lucide-react';
import { getAllBookings, updateBooking } from '../../services/database';
import { Booking, BookingStatus } from '../../types';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminBookingManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadBookings();
  }, [user, navigate]);

  const loadBookings = () => {
    const allBookings = getAllBookings();
    // Sort by date - newest first
    const sorted = allBookings.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    setBookings(sorted);
  };

  const filteredBookings = bookings.filter(booking =>
    (booking.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (booking.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (booking.productTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (booking.status?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = (bookingId: string, newStatus: BookingStatus) => {
    try {
      updateBooking(bookingId, { status: newStatus });
      loadBookings();
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const statusOptions: BookingStatus[] = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">View and manage all bookings</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by booking ID, customer, product, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card key="stat-total">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold mt-1">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card key="stat-pending">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card key="stat-confirmed">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </CardContent>
          </Card>
          <Card key="stat-active">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {bookings.filter(b => b.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card key="stat-completed">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
          <Card key="stat-cancelled">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booked On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rental Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
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
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {booking.id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{booking.customerName}</p>
                              <p className="text-gray-500">{booking.customerPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {booking.productTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {booking.createdAt && booking.createdAt instanceof Date && !isNaN(booking.createdAt.getTime()) ? (
                            <div className="text-sm">
                              <p className="font-medium text-blue-700">
                                {format(booking.createdAt, 'dd MMM yyyy')}
                              </p>
                              <p className="text-xs text-blue-600">
                                {format(booking.createdAt, 'hh:mm a')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {format(booking.startDate, 'dd MMM yyyy')}
                            </p>
                            <p className="text-gray-500">
                              to {format(booking.endDate, 'dd MMM yyyy')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <p className="font-medium text-gray-900">Total: ₹{booking.totalAmount}</p>
                            {booking.advancePaid ? (
                              <>
                                <p className="text-xs text-green-600">
                                  ✓ Advance: ₹{booking.advanceAmount}
                                </p>
                                <p className={`text-xs ${booking.remainingPaymentStatus === 'paid_to_owner' ? 'text-green-600' : 'text-orange-600'}`}>
                                  Remaining: ₹{booking.remainingAmount} ({booking.remainingPaymentStatus === 'paid_to_owner' ? 'Paid ✓' : 'Pending'})
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500">
                                Deposit: ₹{booking.deposit}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={booking.status}
                            onChange={(e) => handleUpdateStatus(booking.id, e.target.value as BookingStatus)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
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