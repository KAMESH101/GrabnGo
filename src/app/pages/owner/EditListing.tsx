import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
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
import { Upload, Loader2, X, MapPin, AlertCircle, Image as ImageIcon, CheckCircle, ArrowLeft } from 'lucide-react';
import { uploadProductImagesToS3 } from '../../services/storage';
import { Alert, AlertDescription } from '../../components/ui/alert';

export const EditListing: React.FC = () => {
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const { ownerListings, updateListing, isLoading } = useOwnerData(user?.id || '');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as Category | '',
    pricePerDay: '',
    pricePerHour: '',
    deposit: '',
    locality: '',
    address: '',
    instructions: '',
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Load existing listing data
  useEffect(() => {
    if (listingId) {
      const listing = ownerListings.find(l => l.id === listingId);
      if (listing) {
        setFormData({
          title: listing.title,
          description: listing.description,
          category: listing.category,
          pricePerDay: listing.pricePerDay.toString(),
          pricePerHour: listing.pricePerHour?.toString() || '',
          deposit: listing.deposit.toString(),
          locality: listing.pickupLocality,
          address: listing.pickupAddress,
          instructions: listing.pickupInstructions || '',
        });
        setExistingImages(listing.images || []);
        setCoordinates({ lat: listing.pickupLat, lng: listing.pickupLng });
        setIsLocationConfirmed(true); // Pre-existing location is already confirmed
      }
    }
  }, [listingId, ownerListings]);

  // Handle new image file selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalImages = existingImages.length + newImages.length + files.length;
    
    // Validate number of images
    if (totalImages > 5) {
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
          setNewImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  };

  // Remove new image from preview
  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  };

  // Handle location confirmation from GPSLocationPicker
  const handleLocationConfirmed = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setIsLocationConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !listingId) {
      toast.error('Invalid request');
      return;
    }

    const totalImages = existingImages.length + newImages.length;
    
    // Validate images
    if (totalImages === 0) {
      setImageError('At least one product image is required');
      toast.error('Please keep or upload at least one product image');
      return;
    }

    // Validate address
    if (!formData.address) {
      setAddressError('Pickup address is required');
      toast.error('Please enter a pickup address');
      return;
    }

    try {
      let finalImageUrls = [...existingImages];

      // Upload new images if any
      if (newImages.length > 0) {
        toast.loading('Uploading new images...');
        const uploadedImageUrls = await uploadProductImagesToS3(newImages, listingId);
        finalImageUrls = [...finalImageUrls, ...uploadedImageUrls];
      }

      // Use confirmed coordinates (already validated in state)
      const finalCoords = coordinates;

      if (!finalCoords) {
        toast.error('Please confirm pickup location using GPS');
        return;
      }

      await updateListing(listingId, {
        title: formData.title,
        description: formData.description,
        category: formData.category as Category,
        pricePerDay: Number(formData.pricePerDay),
        pricePerHour: formData.pricePerHour ? Number(formData.pricePerHour) : undefined,
        deposit: Number(formData.deposit),
        images: finalImageUrls,
        pickupLocality: formData.locality,
        pickupAddress: formData.address,
        pickupLat: finalCoords.lat,
        pickupLng: finalCoords.lng,
        pickupInstructions: formData.instructions,
      });

      toast.dismiss();
      toast.success('✅ Listing updated successfully!');
      
      // Navigate back to manage listings after a short delay
      setTimeout(() => navigate('/owner/manage-listings'), 1500);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to update listing. Please try again.');
    }
  };

  const allImages = [...existingImages, ...newImages];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate('/owner/manage-listings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl mb-2">Edit Listing</h1>
          <p className="text-gray-600">Update your product details and images</p>
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
                        placeholder="5000"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4" />
                      Product Images * (Manage product photos)
                    </Label>
                    
                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {existingImages.map((image, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <img
                                src={image}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              {index === 0 && allImages.length > 1 && (
                                <div className="absolute bottom-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Images */}
                    {newImages.length > 0 && (
                      <div>
                        <p className="text-sm text-green-600 mb-2">New Images to Upload:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {newImages.map((image, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <img
                                src={image}
                                alt={`New ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                New
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    {allImages.length < 5 && (
                      <div>
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                          <Upload className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {allImages.length === 0 ? 'Upload product images' : `Add more images (${allImages.length}/5)`}
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

                    {allImages.length > 0 && (
                      <Alert className="mt-2 bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {allImages.length} image{allImages.length > 1 ? 's' : ''} ready
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      • Keep or replace with clear photos of the actual product<br />
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
                      <div>
                        <Label htmlFor="locality">Pickup Locality (Reference Only)</Label>
                        <Select 
                          value={formData.locality} 
                          onValueChange={(value) => setFormData({ ...formData, locality: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select locality" />
                          </SelectTrigger>
                          <SelectContent>
                            {chennaiLocalities.map((loc) => (
                              <SelectItem key={loc.name} value={loc.name}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          General area - for reference only. Location will be captured via GPS.
                        </p>
                      </div>

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
                          This address is for customer reference. Update GPS location below if needed.
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
                          initialLat={coordinates?.lat}
                          initialLng={coordinates?.lng}
                          address={formData.address}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isLoading || allImages.length === 0 || !isLocationConfirmed}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Listing'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/owner/manage-listings')}>
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
              {allImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Primary Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={allImages[0]}
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
                  <div className={`flex items-center gap-2 ${allImages.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {allImages.length > 0 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    Product images ready
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