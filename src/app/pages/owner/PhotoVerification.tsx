import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Camera, CheckCircle, RotateCcw, User, Calendar, Shield, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { uploadCustomerPhotoToS3, createPhotoAuditLog } from '../../services/storage';
import { getBookingById, updateBooking } from '../../services/database';
import { Booking } from '../../types';

type VerificationStep = 'ready' | 'camera-active' | 'photo-captured' | 'uploading' | 'success';

export const PhotoVerification: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [currentStep, setCurrentStep] = useState<VerificationStep>('ready');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // Fetch booking from database
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      
      setIsLoading(true);
      try {
        const fetchedBooking = await getBookingById(bookingId);
        setBooking(fetchedBooking);
        
        if (!fetchedBooking) {
          toast.error('Booking not found');
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
        toast.error('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooking();
  }, [bookingId]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Booking not found</p>
          <Button onClick={() => navigate('/owner/bookings')} className="mt-4">
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this browser. Please use Chrome, Firefox, or Safari.');
        setShowPermissionHelp(true);
        return;
      }

      // Request camera permission with front camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCurrentStep('camera-active');
        setShowPermissionHelp(false);
        toast.success('Camera started successfully');
      }
    } catch (error: any) {
      console.warn('[Camera Access]', error.name || 'Error');
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('📷 Camera permission denied. Please allow camera access to continue.', {
          duration: 6000,
        });
        setShowPermissionHelp(true);
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('📷 No camera found on this device. Please connect a camera and try again.', {
          duration: 5000,
        });
        setShowPermissionHelp(true);
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('📷 Camera is already in use by another application. Please close other apps and try again.', {
          duration: 5000,
        });
      } else if (error.name === 'OverconstrainedError') {
        // Try again with less strict constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            setCurrentStep('camera-active');
            setShowPermissionHelp(false);
            toast.success('Camera started successfully');
          }
        } catch (fallbackError) {
          toast.error('📷 Unable to access camera. Please check your device settings.');
          setShowPermissionHelp(true);
        }
      } else if (error.name === 'NotSupportedError' || error.name === 'SecurityError') {
        toast.error('📷 Camera access requires HTTPS connection. Please use a secure connection.', {
          duration: 5000,
        });
        setShowPermissionHelp(true);
      } else {
        toast.error('📷 Unable to access camera. Please check browser permissions and try again.', {
          duration: 5000,
        });
        setShowPermissionHelp(true);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const photoDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(photoDataUrl);
        stopCamera();
        setCurrentStep('photo-captured');
        toast.success('Photo captured successfully');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCurrentStep('ready');
    startCamera();
  };

  const confirmPickup = async () => {
    if (!capturedPhoto || !booking) {
      toast.error('Please capture a photo first');
      return;
    }

    try {
      setCurrentStep('uploading');
      toast.info('Uploading photo to secure storage...');
      
      // Step 1: Upload photo to S3 (demo mode)
      const { s3Key, url } = await uploadCustomerPhotoToS3(
        capturedPhoto,
        booking.id,
        booking.customerId
      );
      
      console.log('✅ [PHOTO VERIFICATION] Photo uploaded:', { s3Key, url });
      
      // Step 2: Update booking status to 'active'
      await updateBooking(booking.id, {
        status: 'active',
        pickupVerified: true,
        pickupPhotoUrl: url,
        pickupPhotoS3Key: s3Key,
        pickupTime: new Date(),
      });
      
      console.log('✅ [PHOTO VERIFICATION] Booking status updated to active');
      
      // Step 3: Create audit log
      const auditLog = createPhotoAuditLog(
        booking.id,
        'photo_captured',
        'owner_' + booking.ownerId,
        `Customer photo captured and uploaded to S3. Key: ${s3Key}. Booking status changed to active.`
      );
      
      console.log('✅ [PHOTO VERIFICATION] Audit log created:', auditLog);
      
      setCurrentStep('success');
      toast.success('✅ Pickup verified successfully!');
      toast.success('Rental is now active');
      toast.info('🔒 Photo will be automatically deleted upon rental completion');
      
      setTimeout(() => {
        navigate('/owner/bookings');
      }, 2000);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
      setCurrentStep('photo-captured');
    }
  };

  const cancelCamera = () => {
    stopCamera();
    setCurrentStep('ready');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/owner/booking/${booking.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking Details
          </Button>
          <h1 className="text-3xl mb-2">Pickup Verification</h1>
          <p className="text-gray-600">Customer photo verification for rental pickup</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={booking.productImage}
                  alt={booking.productTitle}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="mb-2">{booking.productTitle}</h3>
                  <p className="text-sm text-gray-600">Booking ID: {booking.id.toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Rental Period</p>
                  <p className="text-sm">
                    {format(booking.startDate, 'dd MMM yyyy')} - {format(booking.endDate, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-indigo-900 mb-1">Privacy & Security</p>
                    <ul className="space-y-1">
                      <li>• Photo stored securely and encrypted</li>
                      <li>• Auto-deleted after rental completion</li>
                      <li>• Used only for security purposes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Camera Section */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Photo Capture</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Step 1: Ready State (Camera NOT Started) */}
              {currentStep === 'ready' && (
                <div className="space-y-4 p-6">
                  <div className="bg-indigo-50 aspect-video rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <Camera className="w-10 h-10 text-indigo-600" />
                    </div>
                    <p className="text-center mb-2 font-medium text-indigo-900">
                      Ready to verify customer
                    </p>
                    <p className="text-center text-sm text-gray-600 mb-6">
                      Ask the customer to be ready. Camera will activate when you click the button below.
                    </p>
                    <Button 
                      onClick={startCamera} 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Start Camera
                    </Button>
                  </div>

                  {showPermissionHelp && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                      <h4 className="font-semibold text-amber-900 mb-2">📷 Camera Permission Required</h4>
                      <p className="text-amber-800 mb-3">
                        To enable camera access, follow these steps for your browser:
                      </p>
                      
                      <div className="space-y-3 text-amber-800">
                        <div>
                          <p className="font-medium mb-1">Chrome/Edge:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                            <li>Click the camera icon in the address bar</li>
                            <li>Select "Always allow camera access"</li>
                            <li>Click "Done" and try again</li>
                          </ol>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-1">Firefox:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                            <li>Click the crossed camera icon in the address bar</li>
                            <li>Remove the camera block</li>
                            <li>Try again and allow camera access</li>
                          </ol>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-1">Safari:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                            <li>Go to Safari → Settings → Websites → Camera</li>
                            <li>Find this website and select "Allow"</li>
                            <li>Try again</li>
                          </ol>
                        </div>
                      </div>

                      <Button 
                        onClick={() => { setShowPermissionHelp(false); startCamera(); }} 
                        className="w-full mt-4 bg-amber-600 hover:bg-amber-700"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    <p className="text-blue-900 font-medium mb-1">📋 Instructions:</p>
                    <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Click "Start Camera" to activate</li>
                      <li>Ask customer to look at the camera</li>
                      <li>Capture the photo</li>
                      <li>Review and confirm pickup</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Step 2: Camera Active */}
              {currentStep === 'camera-active' && (
                <div className="p-0 flex flex-col items-center">
                  <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
                      <Button 
                        onClick={capturePhoto} 
                        className="bg-green-600 hover:bg-green-700 shadow-lg"
                        size="lg"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Capture Photo
                      </Button>
                      <Button onClick={cancelCamera} variant="secondary" size="lg" className="shadow-lg">
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-green-50 p-3 text-sm text-center text-green-800 border-t">
                    <p>✓ Camera active - Ask customer to look at the lens</p>
                  </div>
                </div>
              )}

              {/* Step 3: Photo Captured */}
              {currentStep === 'photo-captured' && capturedPhoto && (
                <div className="p-0 flex flex-col items-center">
                  <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={capturedPhoto}
                      alt="Captured customer photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-md">
                        <CheckCircle className="w-4 h-4" />
                        Captured
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
                      <Button 
                        onClick={confirmPickup} 
                        className="bg-green-600 hover:bg-green-700 shadow-lg"
                        size="lg"
                      >
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Confirm & Activate
                      </Button>
                      <Button onClick={retakePhoto} variant="secondary" size="lg" className="shadow-lg">
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Retake
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-blue-50 p-4 text-sm text-blue-800 border-t">
                    <p className="font-medium">✓ Review the photo</p>
                    <p className="text-xs mt-1">
                      Ensure the customer's face is clearly visible before confirming.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Uploading */}
              {currentStep === 'uploading' && (
                <div className="p-6 space-y-4">
                  {capturedPhoto && (
                    <img
                      src={capturedPhoto}
                      alt="Uploading"
                      className="w-full aspect-video rounded-lg object-cover opacity-75"
                    />
                  )}
                  <div className="bg-indigo-50 p-6 rounded-lg text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-indigo-900 font-medium mb-1">Uploading photo...</p>
                    <p className="text-sm text-indigo-700">
                      Verifying pickup and activating rental
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Success */}
              {currentStep === 'success' && (
                <div className="p-6 space-y-4">
                  <div className="bg-green-50 aspect-video rounded-lg flex flex-col items-center justify-center p-8">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <p className="text-center text-xl font-medium text-green-900 mb-2">
                      Pickup Verified Successfully!
                    </p>
                    <p className="text-center text-sm text-green-700">
                      Rental is now active
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
