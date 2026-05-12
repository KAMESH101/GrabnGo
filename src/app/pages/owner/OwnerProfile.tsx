import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BackButton } from '../../components/ui/BackButton';
import { KycModal } from '../../components/kyc/KycModal';
import { Store, Mail, Phone, MapPin, Shield, CheckCircle, Clock, XCircle, AlertTriangle, Edit3, Save, X, Package, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { KycStatus } from '../../types';

export const OwnerProfile: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    // States
    const [isEditing, setIsEditing] = useState(false);
    const [showKycModal, setShowKycModal] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        city: user?.city || '',
        locality: user?.locality || ''
    });

    // Access control
    if (!user || !user.roles?.includes('owner')) {
        navigate('/');
        return null;
    }

    const handleSave = () => {
        // TODO: Update user via AuthContext or backend API
        toast.success('Profile updated successfully');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            city: user?.city || '',
            locality: user?.locality || ''
        });
        setIsEditing(false);
    };

    const getKycStatusBadge = (status?: KycStatus) => {
        if (!status || status === 'not_submitted') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Not Submitted
                </span>
            );
        }
        if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    <Clock className="w-4 h-4" />
                    Pending Review
                </span>
            );
        }
        if (status === 'verified') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    AI Verified ✓
                </span>
            );
        }
        if (status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    <XCircle className="w-4 h-4" />
                    Rejected
                </span>
            );
        }
    };

    const isKycVerified = user.ownerKycStatus === 'verified';

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
            <div className="max-w-4xl mx-auto">
                <BackButton to="/owner/dashboard" label="Back to Dashboard" className="mb-4" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Owner Profile</h1>
                    {!isEditing && (
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Basic Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="w-5 h-5 text-green-600" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Your personal details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Name - Editable */}
                            <div>
                                <Label htmlFor="name">Name</Label>
                                {isEditing ? (
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1"
                                    />
                                ) : (
                                    <p className="mt-1 text-gray-900 font-medium">{user.name}</p>
                                )}
                            </div>

                            {/* Email - Read Only */}
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </Label>
                                <p className="mt-1 text-gray-700">{user.email || 'Not provided'}</p>
                            </div>

                            {/* Phone - Read Only */}
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone
                                </Label>
                                <p className="mt-1 text-gray-700">{user.phone}</p>
                            </div>

                            {/* City - Editable */}
                            <div>
                                <Label htmlFor="city" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    City
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="mt-1"
                                        placeholder="Enter your city"
                                    />
                                ) : (
                                    <p className="mt-1 text-gray-700">{user.city || 'Not provided'}</p>
                                )}
                            </div>

                            {/* Locality - Editable */}
                            <div>
                                <Label htmlFor="locality">Locality</Label>
                                {isEditing ? (
                                    <Input
                                        id="locality"
                                        value={formData.locality}
                                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                                        className="mt-1"
                                        placeholder="Enter your locality"
                                    />
                                ) : (
                                    <p className="mt-1 text-gray-700">{user.locality || 'Not provided'}</p>
                                )}
                            </div>

                            {/* Edit Controls */}
                            {isEditing && (
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Owner KYC Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                Owner KYC Status
                            </CardTitle>
                            <CardDescription>
                                Identity verification for listing products
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Verification Status:</span>
                                {getKycStatusBadge(user.ownerKycStatus)}
                            </div>

                            {/* Warning Banner if Not Verified */}
                            {!isKycVerified && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-900 mb-1">
                                                Complete Owner KYC to list products
                                            </p>
                                            <p className="text-xs text-amber-800 mb-3">
                                                You need to verify your identity before you can list products for rent.
                                            </p>
                                            <Button
                                                onClick={() => setShowKycModal(true)}
                                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                                size="sm"
                                            >
                                                Complete Owner KYC
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rejected state — show retry */}
                            {user.ownerKycStatus === 'rejected' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-900 mb-1">
                                                Face verification failed
                                            </p>
                                            <p className="text-xs text-red-700 mb-3">
                                                Your live photo did not match your proof document. Please try again in good lighting.
                                            </p>
                                            <Button
                                                onClick={() => setShowKycModal(true)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                size="sm"
                                            >
                                                Retry KYC
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Success Message if Verified */}
                            {isKycVerified && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-green-900">
                                                AI Auto-Verified — Instantly Active
                                            </p>
                                            <p className="text-xs text-green-800 mt-1">
                                                Your identity was verified automatically. You can now list products for rent.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Listing Access Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {isKycVerified ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                Listing Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isKycVerified ? (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Listing access active</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-red-700">
                                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Listing access locked</p>
                                        <p className="text-sm text-red-600 mt-1">
                                            Complete your Owner KYC verification to unlock listing access
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Account Status:</span>
                                <span className={`font-medium ${user.accountLocked ? 'text-red-600' : 'text-green-600'}`}>
                                    {user.accountLocked ? 'Locked' : 'Active'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Phone Verified:</span>
                                <span className={`font-medium ${user.phoneVerified ? 'text-green-600' : 'text-gray-600'}`}>
                                    {user.phoneVerified ? 'Yes' : 'No'}
                                </span>
                            </div>
                            {user.isMockAccount && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Account Type:</span>
                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                        Mock/Test Account
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* KYC Modal */}
            <KycModal
                isOpen={showKycModal}
                role="owner"
                onClose={() => setShowKycModal(false)}
                onSuccess={() => {
                    refreshUser();
                    setShowKycModal(false);
                    toast.success('Account activated instantly! You can now list products.');
                    navigate('/owner/dashboard');
                }}
            />
        </div>
    );
};
