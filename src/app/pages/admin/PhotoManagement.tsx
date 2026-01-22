import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Camera, Trash2, Shield, Eye, Clock, Download, AlertCircle } from 'lucide-react';
import { getAllBookings } from '../../services/database';
import { getCustomerPhotoFromS3, deleteCustomerPhotoFromS3 } from '../../services/storage';
import { Booking } from '../../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const PhotoManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadBookings();
  }, [user, navigate]);

  const loadBookings = () => {
    setIsLoading(true);
    try {
      const allBookings = getAllBookings();
      // Only show bookings that have a pickup photo
      const bookingsWithPhotos = allBookings.filter(b => b.pickupPhotoS3Key || b.pickupPhotoUrl);
      setBookings(bookingsWithPhotos.sort((a, b) => {
        const dateA = a.pickupTime ? new Date(a.pickupTime).getTime() : 0;
        const dateB = b.pickupTime ? new Date(b.pickupTime).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (error) {
      toast.error('Failed to load photo data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPhoto = async (s3Key: string) => {
    try {
      const url = await getCustomerPhotoFromS3(s3Key);
      if (url) {
        setSelectedPhoto(url);
      } else {
        toast.error('Photo not found or expired');
      }
    } catch (error) {
      toast.error('Error retrieving photo');
    }
  };

  const handleDeletePhoto = async (bookingId: string, s3Key: string) => {
    if (!window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this verification photo? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCustomerPhotoFromS3(s3Key, bookingId);
      toast.success('Photo deleted successfully');
      loadBookings();
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-8 h-8 text-indigo-600" />
              Customer Photo Archive
            </h1>
            <p className="text-gray-600 mt-2">
              Secure storage of verification photos for security and legal compliance.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 max-w-md">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Security Protocol:</strong> Photos are for verification only. 
              They should be deleted immediately after a rental ends successfully to protect privacy.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">Loading records...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-12 text-center">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No verification photos found in the system.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium text-sm">
                        <div className="flex flex-col">
                          <span>{booking.pickupTime ? format(booking.pickupTime, 'dd MMM yyyy') : 'N/A'}</span>
                          <span className="text-xs text-gray-500">{booking.pickupTime ? format(booking.pickupTime, 'HH:mm') : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{booking.id.substring(0, 12)}...</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.customerName}</span>
                          <span className="text-xs text-gray-500">{booking.customerPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{booking.productTitle}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'active' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => booking.pickupPhotoS3Key && handleViewPhoto(booking.pickupPhotoS3Key)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => booking.pickupPhotoS3Key && handleDeletePhoto(booking.id, booking.pickupPhotoS3Key)}
                          disabled={booking.status === 'active'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Photo Preview Overlay */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full overflow-hidden relative">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold">Verification Photo Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPhoto(null)}>Close</Button>
              </div>
              <div className="p-4 bg-gray-100 flex justify-center">
                <img src={selectedPhoto} alt="Verification" className="max-h-[70vh] object-contain rounded shadow-lg" />
              </div>
              <div className="p-4 border-t flex justify-end">
                <Button onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedPhoto;
                  link.download = 'customer-verification.jpg';
                  link.click();
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Download for Records
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
