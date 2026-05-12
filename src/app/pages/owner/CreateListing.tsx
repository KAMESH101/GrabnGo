import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useOwnerData } from '../../hooks/useOwnerData';
import { Navbar } from '../../components/shared/Navbar';
import { LeafletLocationPicker } from '../../components/shared/LeafletLocationPicker';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { chennaiLocalities } from '../../data/mockData';
import { Category } from '../../types';
import { toast } from 'sonner';
import { Upload, Loader2, X, MapPin, AlertCircle, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { uploadProductImagesToS3 } from '../../services/storage';
import { Alert, AlertDescription } from '../../components/ui/alert';

export const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createListing, isLoading } = useOwnerData(user?.id || '');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as Category | '',
    pricePerDay: '',
    pricePerHour: '',
    deposit: '0', // Default to 0 (no deposit required)
    locality: '',
    address: '',
    instructions: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Handle image file selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate number of images
    if (images.length + files.length > 5) {
      setImageError('Maximum 5 images allowed');
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImageError(null);

    // Convert files to data URLs
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image from preview
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  };

  // Handle location confirmation from LeafletLocationPicker
  const handleLocationConfirmed = (lat: number, lng: number, locality: string, formattedAddress?: string) => {
    console.log('📍 [CREATE LISTING] Location confirmed from map:', {
      lat,
      lng,
      locality,
      formattedAddress,
      timestamp: new Date().toISOString()
    });

    setCoordinates({ lat, lng });
    // STRICT RULE: Use the resolved locality from reverse geocoding, NOT the dropdown
    setFormData({
      ...formData,
      locality,
      // Auto-fill address if we got a formatted address from GPS
      address: formattedAddress || formData.address
    });
    setIsLocationConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to create a listing');
      return;
    }

    // Validate images
    if (images.length === 0) {
      setImageError('At least one product image is required');
      toast.error('Please upload at least one product image');
      return;
    }

    // Validate address
    if (!formData.address) {
      setAddressError('Pickup address is required');
      toast.error('Please enter a pickup address');
      return;
    }

    // Validate location confirmation
    if (!isLocationConfirmed || !coordinates) {
      toast.error('Please confirm pickup location using GPS before submitting');
      return;
    }

    try {
      // Generate temporary listing ID for image upload
      const tempListingId = `listing_${Date.now()}`;

      // Upload images to S3 (demo mode)
      toast.loading('Uploading product images...');
      const uploadedImageUrls = await uploadProductImagesToS3(images, tempListingId);

      // Use confirmed coordinates (already validated above)
      const finalCoords = coordinates;

      // Action: CREATE listing
      // Data Flow: Save to Listings Collection with ownerId = currentOwner.id
      // The listing will automatically appear in Manage Listings after creation
      await createListing({
        title: formData.title,
        description: formData.description,
        category: formData.category as Category,
        pricePerDay: Number(formData.pricePerDay),
        pricePerHour: formData.pricePerHour ? Number(formData.pricePerHour) : undefined,
        deposit: formData.deposit ? Number(formData.deposit) : 0, // Default to 0 if not specified
        images: uploadedImageUrls, // Use uploaded images
        ownerName: user.name,
        ownerPhone: user.phone, // Added for customer-owner contact
        pickupLocality: formData.locality,
        pickupAddress: formData.address,
        pickupLat: finalCoords.lat,
        pickupLng: finalCoords.lng,
        pickupInstructions: formData.instructions,
        availability: true,
      });

      toast.dismiss();
      toast.success('✅ Listing created successfully!');
      toast.success('📍 Your listing is now visible to customers');

      // Navigate to manage listings after a short delay
      setTimeout(() => navigate('/owner/manage-listings'), 1500);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to create listing. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Create New Listing</h1>
          <p className="text-gray-600">Add your product details and upload clear images of the actual item</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Listing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cars">Cars</SelectItem>
                        <SelectItem value="Bikes">Bikes</SelectItem>
                        <SelectItem value="Drones">Drones</SelectItem>
                        <SelectItem value="Cameras">Cameras</SelectItem>
                        <SelectItem value="Equipments">Equipments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Honda City 2022 - Automatic"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your rental item..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="pricePerDay">Price per Day (₹) *</Label>
                      <Input
                        id="pricePerDay"
                        type="number"
                        placeholder="1500"
                        value={formData.pricePerDay}
                        onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pricePerHour">Price per Hour (₹)</Label>
                      <Input
                        id="pricePerHour"
                        type="number"
                        placeholder="150"
                        value={formData.pricePerHour}
                        onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit">Security Deposit (₹) *</Label>
                      <Input
                        id="deposit"
                        type="number"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                        required={false}
                        placeholder="0 (optional)"
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4" />
                      Product Images * (Upload actual product photos)
                    </Label>

                    {/* Image Previews */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    {images.length < 5 && (
                      <div>
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                          <Upload className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {images.length === 0 ? 'Upload product images' : `Add more images (${images.length}/5)`}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {imageError && (
                      <Alert className="mt-2 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{imageError}</AlertDescription>
                      </Alert>
                    )}

                    {images.length > 0 && (
                      <Alert className="mt-2 bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {images.length} image{images.length > 1 ? 's' : ''} ready to upload
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      • Upload clear photos of the actual product<br />
                      • Maximum 5 images, up to 5MB each<br />
                      • First image will be the primary display image
                    </p>
                  </div>

                  {/* Pickup Location */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      Pickup Location
                    </h3>

                    <div className="space-y-4">
                      {formData.locality && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>Locality resolved from GPS:</strong> {formData.locality}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="address">Pickup Address (Reference Only) *</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter full pickup address with street, building number, landmarks..."
                          rows={3}
                          value={formData.address}
                          onChange={(e) => {
                            setFormData({ ...formData, address: e.target.value });
                            setAddressError(null);
                          }}
                          required
                        />
                        {addressError && (
                          <Alert className="mt-2 bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{addressError}</AlertDescription>
                          </Alert>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          This address is for customer reference. Exact location will be captured using GPS below.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="instructions">Pickup Instructions</Label>
                        <Textarea
                          id="instructions"
                          placeholder="e.g., Call 30 mins before pickup, parking available..."
                          rows={2}
                          value={formData.instructions}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        />
                      </div>

                      {/* GPS Location Picker */}
                      <div className="border-t pt-4">
                        <LeafletLocationPicker
                          onLocationConfirmed={handleLocationConfirmed}
                          address={formData.address}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isLoading || images.length === 0 || !isLocationConfirmed}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Listing'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/owner/dashboard')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Image Preview */}
              {images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Primary Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={images[0]}
                      alt="Primary product"
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This will be displayed to customers
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Requirements Checklist */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Requirements Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${images.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {images.length > 0 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    Product images uploaded
                  </div>
                  <div className={`flex items-center gap-2 ${isLocationConfirmed ? 'text-green-600' : 'text-gray-500'}`}>
                    {isLocationConfirmed ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    GPS location confirmed
                  </div>
                  <div className={`flex items-center gap-2 ${formData.title && formData.description ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.title && formData.description ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    Basic details filled
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};