/**
 * KYC Modal - Main Component
 * Orchestrates the complete KYC verification flow
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DocumentUpload } from './DocumentUpload';
import { LiveCameraCapture } from './LiveCameraCapture';
import { Loader2, CheckCircle, XCircle, FileText, Camera, Shield, AlertTriangle, Mail, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { submitCustomerKyc, submitOwnerKyc } from '../../services/kyc';

type KycStep =
    | 'document_upload'
    | 'live_photo'
    | 'ai_processing'
    | 'submitting'
    | 'face_match_failed'
    | 'success'
    | 'error';

interface KycModalProps {
    isOpen: boolean;
    role: 'customer' | 'owner';
    onClose: () => void;
    onSuccess: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({
    isOpen,
    role,
    onClose,
    onSuccess,
}) => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<KycStep>('document_upload');
    const [proofDocumentUrl, setProofDocumentUrl] = useState<string | null>(null);
    const [livePhotoUrl, setLivePhotoUrl] = useState<string | null>(null);
    const [aiFaceMatchResult, setAiFaceMatchResult] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    if (!user) return null;

    const getRoleLabel = () => (role === 'customer' ? 'Customer' : 'Owner');

    const getStepProgress = (): number => {
        const stepValues: Record<KycStep, number> = {
            document_upload: 25,
            live_photo: 50,
            ai_processing: 65,
            submitting: 90,
            face_match_failed: 0,
            success: 100,
            error: 0,
        };
        return stepValues[currentStep];
    };

    const handleDocumentUpload = (dataUrl: string) => {
        setProofDocumentUrl(dataUrl);
        setCurrentStep('live_photo');
        toast.success('Proof document uploaded');
    };

    const handleLivePhotoCapture = async (photoDataUrl: string) => {
        setLivePhotoUrl(photoDataUrl);
        setCurrentStep('ai_processing');

        // Wait a moment for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Submit KYC — backend handles ALL face processing (server/index.js)
            setCurrentStep('submitting');

            const submission = role === 'customer'
                ? await submitCustomerKyc(user, proofDocumentUrl!, photoDataUrl)
                : await submitOwnerKyc(user, proofDocumentUrl!, photoDataUrl);

            setAiFaceMatchResult(submission.aiFaceMatch ?? null);

            if (submission.status === 'verified') {
                toast.success('Face verification successful! KYC approved.');
                setCurrentStep('success');
            } else {
                // Backend rejected — show reason from backend pipeline
                const backendError = (submission as any)._faceMatchError
                    || 'Face verification failed. Please contact admin for manual review.';
                setErrorMessage(backendError);
                toast.error('Face verification failed.');
                setCurrentStep('face_match_failed');
            }
        } catch (error) {
            console.error('KYC submission error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to submit KYC');
            setCurrentStep('error');
            toast.error('KYC submission failed');
        }
    };

    const handleClose = () => {
        if (currentStep === 'success') {
            // Refresh user state in AuthContext so profile reflects verified status
            refreshUser();
            onSuccess();
        }
        onClose();
    };

    const handleReset = () => {
        setCurrentStep('document_upload');
        setProofDocumentUrl(null);
        setLivePhotoUrl(null);
        setAiFaceMatchResult(null);
        setErrorMessage('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        {getRoleLabel()} KYC Verification
                    </DialogTitle>
                    <DialogDescription>
                        Complete your identity verification to access {role === 'customer' ? 'rental services' : 'listing features'}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Bar */}
                {currentStep !== 'success' && currentStep !== 'error' && currentStep !== 'face_match_failed' && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                            <span className={currentStep === 'document_upload' ? 'text-indigo-600 font-medium' : ''}>
                                <FileText className="w-3 h-3 inline mr-1" />
                                Document
                            </span>
                            <span className={currentStep === 'live_photo' ? 'text-indigo-600 font-medium' : ''}>
                                <Camera className="w-3 h-3 inline mr-1" />
                                Live Photo
                            </span>
                            <span className={currentStep === 'ai_processing' || currentStep === 'submitting' ? 'text-indigo-600 font-medium' : ''}>
                                <Shield className="w-3 h-3 inline mr-1" />
                                Verification
                            </span>
                        </div>
                        <Progress value={getStepProgress()} className="h-2" />
                    </div>
                )}

                {/* Step Content */}
                <div className="py-4">
                    {currentStep === 'document_upload' && (
                        <DocumentUpload onUploadComplete={handleDocumentUpload} />
                    )}

                    {currentStep === 'live_photo' && (
                        <LiveCameraCapture
                            onCaptureComplete={handleLivePhotoCapture}
                            onBack={() => setCurrentStep('document_upload')}
                        />
                    )}

                    {currentStep === 'face_match_failed' && (
                        <div className="py-10 text-center">
                            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2 text-red-900">
                                Face Verification Failed
                            </h3>
                            <p className="text-gray-600 mb-2 max-w-md mx-auto">
                                {errorMessage || 'We could not verify that your live photo matches your proof document.'}
                            </p>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                                Ensure your face is clearly visible, lighting is good, and your face matches the ID photo.
                            </p>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
                                <p className="font-medium text-amber-900 mb-2">What you can do:</p>
                                <ul className="text-sm text-amber-800 space-y-2">
                                    <li>• <strong>Redo KYC</strong> — retake your live photo in good lighting, facing the camera directly</li>
                                    <li>• <strong>Contact Admin</strong> — if the problem persists, reach out for manual verification</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 justify-center flex-wrap">
                                <Button
                                    onClick={handleReset}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Redo KYC
                                </Button>
                                <Button
                                    onClick={() => window.location.href = 'mailto:support@grabngo.com'}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    Contact Admin
                                </Button>
                                <Button
                                    onClick={handleClose}
                                    variant="ghost"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}

                    {(currentStep === 'ai_processing' || currentStep === 'submitting') && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Processing Your Verification</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {currentStep === 'ai_processing' ? 'Running AI face matching...' : 'Submitting your KYC documents...'}
                            </p>
                            <div className="max-w-md mx-auto text-left text-xs text-gray-500 space-y-1 bg-gray-50 p-4 rounded">
                                <p>✓ Analyzing face features</p>
                                <p>✓ Comparing with proof document photo</p>
                                <p>✓ Encrypting and uploading documents</p>
                            </div>
                        </div>
                    )}


                    {currentStep === 'success' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2 text-green-900">
                                Account Activated! 🎉
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Your identity has been verified successfully. Your {getRoleLabel().toLowerCase()} account is now active.
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                                <div className="flex items-start gap-2">
                                    <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-left">
                                        <p className="font-medium text-green-900 mb-1">Instantly Verified</p>
                                        <p className="text-green-800">
                                            No waiting required — you can {role === 'customer' ? 'browse and rent vehicles right now' : 'start listing your vehicles right now'}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    refreshUser();
                                    onSuccess();
                                    onClose();
                                    navigate(role === 'customer' ? '/customer/home' : '/owner/dashboard');
                                }}
                                className="bg-green-600 hover:bg-green-700"
                                size="lg"
                            >
                                Get Started
                            </Button>
                        </div>
                    )}

                    {currentStep === 'error' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2 text-red-900">
                                Verification Failed
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {errorMessage || 'An error occurred during verification. Please try again.'}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={handleClose}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {currentStep !== 'success' && currentStep !== 'error' && currentStep !== 'face_match_failed' && (
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-start gap-2 text-xs text-gray-500">
                            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>
                                Your documents are encrypted and stored securely. They will only be used for identity verification and deleted after approval/rejection.
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
