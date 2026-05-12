/**
 * Live Camera Capture Component
 * Captures live photo for KYC verification
 * Reuses logic from PhotoVerification.tsx with mandatory visibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Camera, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LiveCameraCaptureProps {
    onCaptureComplete: (photoDataUrl: string) => void;
    onBack?: () => void;
}

type CameraState = 'ready' | 'active' | 'captured';

export const LiveCameraCapture: React.FC<LiveCameraCaptureProps> = ({ onCaptureComplete, onBack }) => {
    const [cameraState, setCameraState] = useState<CameraState>('ready');
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [showPermissionHelp, setShowPermissionHelp] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            // Check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error('Camera not supported on this browser');
                setShowPermissionHelp(true);
                return;
            }

            setCameraState('active');

            // Request camera permission with front camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Wait for video element to be ready
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setShowPermissionHelp(false);
                    toast.success('Camera started successfully');
                }
            }, 50);
        } catch (error: any) {
            console.warn('[Camera Access]', error.name);
            setCameraState('ready');

            // Provide specific error messages
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error('Camera permission denied. Please allow camera access.');
                setShowPermissionHelp(true);
            } else if (error.name === 'NotFoundError') {
                toast.error('No camera found on this device.');
                setShowPermissionHelp(true);
            } else if (error.name === 'NotReadableError') {
                toast.error('Camera is already in use by another application.');
            } else {
                // Try again with less strict constraints
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallbackStream;
                        setCameraState('active');
                        setShowPermissionHelp(false);
                        toast.success('Camera started successfully');
                    }
                } catch {
                    toast.error('Unable to access camera. Please check browser permissions.');
                    setShowPermissionHelp(true);
                }
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
                setCameraState('captured');
                toast.success('Photo captured successfully');
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setCameraState('ready');
        startCamera();
    };

    const handleContinue = () => {
        if (capturedPhoto) {
            onCaptureComplete(capturedPhoto);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex gap-2">
                    <Camera className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-900">
                        <p className="font-medium mb-1">Live Photo Capture:</p>
                        <ul className="space-y-1 text-green-800 ml-1">
                            <li>• Face the camera directly</li>
                            <li>• Ensure good lighting</li>
                            <li>• Remove sunglasses or face coverings</li>
                            <li>• Keep a neutral expression</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Ready State */}
            {cameraState === 'ready' && !capturedPhoto && (
                <div className="space-y-4">
                    <div className="bg-indigo-50 aspect-video rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                            <Camera className="w-10 h-10 text-indigo-600" />
                        </div>
                        <p className="text-center mb-2 font-medium text-indigo-900">
                            Ready to capture live photo
                        </p>
                        <p className="text-center text-sm text-gray-600 mb-6">
                            Camera will activate when you click the button below
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
                            <p className="text-amber-800 mb-2">
                                To enable camera access, check your browser settings:
                            </p>
                            <div className="space-y-2 text-amber-800 text-xs">
                                <p><strong>Chrome/Edge:</strong> Click the camera icon in address bar → Allow</p>
                                <p><strong>Firefox:</strong> Click the camera icon in address bar → Allow</p>
                                <p><strong>Safari:</strong> Safari → Settings → Websites → Camera → Allow</p>
                            </div>
                            <Button
                                onClick={() => { setShowPermissionHelp(false); startCamera(); }}
                                className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                                size="sm"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Camera Active - MANDATORY VISIBLE PREVIEW */}
            {cameraState === 'active' && (
                <div className="space-y-3">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                            <Button
                                onClick={capturePhoto}
                                className="bg-green-600 hover:bg-green-700"
                                size="lg"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Capture Photo
                            </Button>
                            <Button
                                onClick={() => {
                                    stopCamera();
                                    setCameraState('ready');
                                }}
                                variant="secondary"
                                size="lg"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                    <div className="bg-green-50 p-2 text-center text-sm text-green-800 rounded">
                        ✓ Camera active - Look at the camera
                    </div>
                </div>
            )}

            {/* Photo Captured */}
            {cameraState === 'captured' && capturedPhoto && (
                <div className="space-y-3">
                    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                            src={capturedPhoto}
                            alt="Captured photo"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Captured
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={retakePhoto}
                            className="flex-1"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retake
                        </Button>
                        <Button
                            onClick={handleContinue}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {onBack && cameraState === 'ready' && !capturedPhoto && (
                <Button variant="ghost" onClick={onBack} className="w-full">
                    Back
                </Button>
            )}
        </div>
    );
};
