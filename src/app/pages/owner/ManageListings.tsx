// Owner Manage Listings Page
// Shows all product listings owned by the logged-in owner
// Data binding: useOwnerData() hook to fetch listings where ownerId = user.id

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useOwnerData } from '../../hooks/useOwnerData';
import { Navbar } from '../../components/shared/Navbar';
import { OwnerListingCard } from '../../components/owner/OwnerListingCard';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { 
  PlusCircle, 
  Search, 
  Grid, 
  List, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, Category } from '../../types';

export const ManageListings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ownerListings, isLoading, deleteListing, toggleListingAvailability } = useOwnerData(user?.id || '');

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let filtered = [...ownerListings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(listing =>
        statusFilter === 'active' ? listing.availability : !listing.availability
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.pricePerDay - a.pricePerDay;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'date':
        default:
          return b.id.localeCompare(a.id); // Assuming newer IDs are larger
      }
    });

    return filtered;
  }, [ownerListings, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actions
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteListing(id);
        toast.success('Listing deleted successfully');
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await toggleListingAvailability(id);
      toast.success('Listing status updated');
    } catch (error) {
      toast.error('Failed to update listing status');
    }
  };

  // UI States - Loading
  if (isLoading && ownerListings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading listings...</p>
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
            <h1 className="text-3xl mb-2">Manage Listings</h1>
            <p className="text-gray-600">Total: {ownerListings.length} listings</p>
          </div>
          <Button
            onClick={() => navigate('/owner/create-listing')}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Listing
          </Button>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="md:col-span-2">
                <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
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

              {/* Sort By */}
              <div className="md:col-span-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="md:col-span-2 flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex-1"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="flex-1"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI State - No listings */}
        {ownerListings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Listings Yet</h3>
              <p className="text-gray-600 mb-4">Start by creating your first rental listing</p>
              <Button onClick={() => navigate('/owner/create-listing')} className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="w-5 h-5 mr-2" />
                Create First Listing
              </Button>
            </CardContent>
          </Card>
        ) : filteredListings.length === 0 ? (
          // UI State - No filtered results
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Table View */}
            {viewMode === 'table' && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price/Day</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium">{listing.title}</p>
                                <p className="text-sm text-gray-500 line-clamp-1">{listing.description}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{listing.category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{listing.pricePerDay}</TableCell>
                          <TableCell className="text-sm">{listing.pickupLocality}</TableCell>
                          <TableCell>
                            <Badge variant={listing.availability ? 'default' : 'secondary'}>
                              {listing.availability ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleAvailability(listing.id)}
                                title={listing.availability ? 'Deactivate' : 'Activate'}
                              >
                                {listing.availability ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/owner/edit-listing/${listing.id}`)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(listing.id, listing.title)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Card View */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedListings.map((listing) => (
                  <OwnerListingCard 
                    key={listing.id} 
                    listing={listing}
                    onToggleAvailability={handleToggleAvailability}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};