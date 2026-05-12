// Reusable component for displaying owner listings in card view
// Data Binding: Dynamic listing data from Listings Collection (owner's listings)

import React from 'react';
import { useNavigate } from 'react-router';
import { Product } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface OwnerListingCardProps {
  listing: Product;
  onToggleAvailability: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}

export const OwnerListingCard: React.FC<OwnerListingCardProps> = ({
  listing,
  onToggleAvailability,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={listing.availability ? 'default' : 'secondary'}>
            {listing.availability ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <Badge variant="outline" className="mb-2">
          {listing.category}
        </Badge>
        <h3 className="font-medium mb-1">{listing.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-medium text-blue-600">₹{listing.pricePerDay}</p>
            <p className="text-xs text-gray-500">per day</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{listing.pickupLocality}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleAvailability(listing.id)}
            className="flex-1"
          >
            {listing.availability ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {listing.availability ? 'Disable' : 'Enable'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/owner/edit-listing/${listing.id}`)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(listing.id, listing.title)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};