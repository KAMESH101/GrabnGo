// Data source: Bookings Collection
// Filters: ownerId = loggedInOwner.id
// Actions: FETCH ownerBookings, GENERATE report, EXPORT report

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOwnerData } from '../../hooks/useOwnerData';
import { Navbar } from '../../components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Badge } from '../../components/ui/badge';
import { 
  Download, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, BookingStatus, Category } from '../../types';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const { ownerBookings, ownerListings, isLoading } = useOwnerData(user?.id || '');
  
  // Date range
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  
  // Filters
  const [productFilter, setProductFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return ownerBookings.filter((booking) => {
      // Date range filter
      const bookingDate = new Date(booking.startDate);
      if (startDate && bookingDate < startDate) return false;
      if (endDate && bookingDate > endDate) return false;
      
      // Product filter
      if (productFilter !== 'all' && booking.productId !== productFilter) return false;
      
      // Category filter
      if (categoryFilter !== 'all') {
        const product = ownerListings.find(p => p.id === booking.productId);
        if (product && product.category !== categoryFilter) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      
      return true;
    });
  }, [ownerBookings, ownerListings, startDate, endDate, productFilter, categoryFilter, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEarnings = filteredBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    const totalBookings = filteredBookings.length;
    const activeRentals = filteredBookings.filter(b => b.status === 'active').length;
    const completedRentals = filteredBookings.filter(b => b.status === 'completed').length;
    const cancelledRentals = filteredBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length;
    
    return {
      totalEarnings,
      totalBookings,
      activeRentals,
      completedRentals,
      cancelledRentals,
    };
  }, [filteredBookings]);

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Owner Earnings Report', 14, 20);
      
      // Add date range
      doc.setFontSize(10);
      doc.text(
        `Period: ${startDate ? format(startDate, 'dd MMM yyyy') : 'All time'} - ${endDate ? format(endDate, 'dd MMM yyyy') : 'Present'}`,
        14,
        30
      );
      
      // Add statistics
      doc.text(`Total Earnings: ₹${stats.totalEarnings}`, 14, 40);
      doc.text(`Total Bookings: ${stats.totalBookings}`, 14, 46);
      doc.text(`Completed: ${stats.completedRentals} | Active: ${stats.activeRentals} | Cancelled: ${stats.cancelledRentals}`, 14, 52);
      
      // Add table
      const tableData = filteredBookings.map((booking) => [
        booking.id.toUpperCase(),
        booking.productTitle,
        booking.customerName,
        format(new Date(booking.startDate), 'dd MMM yyyy'),
        format(new Date(booking.endDate), 'dd MMM yyyy'),
        `₹${booking.totalAmount}`,
        `₹${booking.gst}`,
        `₹${booking.deposit}`,
        booking.status,
      ]);
      
      autoTable(doc, {
        head: [['Booking ID', 'Product', 'Customer', 'Start Date', 'End Date', 'Total', 'GST', 'Deposit', 'Status']],
        body: tableData,
        startY: 60,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      doc.save(`owner-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF report');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = [
        'Booking ID',
        'Product Name',
        'Customer Name',
        'Customer Phone',
        'Start Date',
        'End Date',
        'Rental Duration (days)',
        'Price',
        'GST',
        'Deposit',
        'Total Amount',
        'Payment Status',
        'Booking Status',
        'Date Booked',
      ];
      
      const rows = filteredBookings.map((booking) => {
        const duration = Math.ceil(
          (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return [
          booking.id.toUpperCase(),
          booking.productTitle,
          booking.customerName,
          booking.customerPhone,
          format(new Date(booking.startDate), 'dd MMM yyyy'),
          format(new Date(booking.endDate), 'dd MMM yyyy'),
          duration,
          booking.subtotal,
          booking.gst,
          booking.deposit,
          booking.totalAmount,
          booking.paymentStatus || 'N/A',
          booking.status,
          format(new Date(booking.startDate), 'dd MMM yyyy HH:mm'),
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `owner-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate CSV report');
    }
  };

  // UI State - Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl mb-2">Earnings Report</h1>
            <p className="text-gray-600">View and download your business reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd MMM yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd MMM yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Product Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {ownerListings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id}>
                        {listing.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Cars">Cars</SelectItem>
                    <SelectItem value="Bikes">Bikes</SelectItem>
                    <SelectItem value="Drones">Drones</SelectItem>
                    <SelectItem value="Cameras">Cameras</SelectItem>
                    <SelectItem value="Equipments">Equipments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Booking Status</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl mt-1">₹{stats.totalEarnings}</p>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl mt-1">{stats.totalBookings}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Rentals</p>
                  <p className="text-2xl mt-1">{stats.activeRentals}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl mt-1">{stats.completedRentals}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl mt-1">{stats.cancelledRentals}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UI State - No report data */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">No bookings found for the selected filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setProductFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Bookings Table
          <Card>
            <CardHeader>
              <CardTitle>Booking Details ({filteredBookings.length} bookings)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">{booking.id.toUpperCase()}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{booking.productTitle}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-xs text-gray-500">{booking.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p>{format(new Date(booking.startDate), 'dd MMM')}</p>
                            <p className="text-xs text-gray-500">to {format(new Date(booking.endDate), 'dd MMM')}</p>
                          </div>
                        </TableCell>
                        <TableCell>₹{booking.subtotal}</TableCell>
                        <TableCell>₹{booking.gst}</TableCell>
                        <TableCell>₹{booking.deposit}</TableCell>
                        <TableCell className="font-medium">₹{booking.totalAmount}</TableCell>
                        <TableCell>
                          <Badge variant={booking.paymentStatus === 'success' ? 'default' : 'secondary'}>
                            {booking.paymentStatus || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === 'completed'
                                ? 'default'
                                : booking.status === 'active'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
