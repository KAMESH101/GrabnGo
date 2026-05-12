import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MapPin, Calendar, IndianRupee, AlertCircle, Clock, Loader2, User, Phone } from 'lucide-react';
import { getProductById } from '../../services/database';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import L from 'leaflet';
import { Navbar } from '../../components/shared/Navbar';
import { LocationGuardWrapper } from '../../components/customer/LocationGuardWrapper';
import { LeafletMap } from '../../components/shared/LeafletMap';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { user } = useAuth();

  // Fetch product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        console.log('🔍 [PRODUCT DETAIL] Fetching product:', id);
        const fetchedProduct = await getProductById(id);

        if (fetchedProduct) {
          setProduct(fetchedProduct);
          console.log('✅ [PRODUCT DETAIL] Product loaded:', fetchedProduct.title);
        } else {
          console.warn('⚠️ [PRODUCT DETAIL] Product not found');
        }
      } catch (error) {
        console.error('❌ [PRODUCT DETAIL] Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Product not found</p>
          <Button onClick={() => navigate('/customer/home')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
    navigate(`/customer/booking/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <BackButton />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <Card>
              <CardContent className="p-0">
                <div className="w-full h-96 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Info */}
          <div>
            <div className="text-sm text-indigo-600 mb-2">{product.category}</div>
            <h1 className="text-3xl mb-4">{product.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div>
                <span className="text-4xl text-indigo-600">₹{product.pricePerDay}</span>
                <span className="text-gray-600">/day</span>
              </div>
              {product.pricePerHour && (
                <div>
                  <span className="text-2xl text-gray-600">₹{product.pricePerHour}</span>
                  <span className="text-gray-500">/hour</span>
                </div>
              )}
            </div>


            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="block">Pickup Location</span>
                  <span className="text-gray-600">{product.pickupLocality}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="block">Owner</span>
                  <span className="text-gray-600">{product.ownerName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="block">Contact Number</span>
                  <a
                    href={`tel:${product.ownerPhone}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {product.ownerPhone}
                  </a>
                </div>
              </div>
            </div>

            <LocationGuardWrapper actionName="Book Now">
              {({ checkLocationAndProceed }) => (
                <Button
                  onClick={async () => {
                    const hasLocation = await checkLocationAndProceed();
                    if (hasLocation) {
                      handleBookNow();
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 mb-4"
                  size="lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              )}
            </LocationGuardWrapper>
            <Button
              onClick={() => {
                window.location.href = `tel:${product.ownerPhone}`;
                toast.success(`Calling ${product.ownerName}...`);
              }}
              variant="outline"
              className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Owner
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="location">Pickup Location</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700">{product.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="location" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="mb-2">Pickup Address</h3>
                    <p className="text-gray-700">{product.pickupAddress}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="mb-2">Pickup Instructions</h3>
                    <p className="text-gray-700">{product.pickupInstructions}</p>
                  </div>
                  {/* Leaflet Maps Integration */}
                  <LeafletMap
                    lat={product.pickupLat}
                    lng={product.pickupLng}
                    title={product.title}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="terms" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Valid ID proof required at pickup</li>
                    <li>Late return charges: ₹{Math.floor(product.pricePerDay * 0.2)}/hour</li>
                    <li>Fuel/battery charges as per usage</li>
                    <li>Cancellation allowed up to 24 hours before start</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div >
  );
};