/**
 * Become Owner Button Component
 * Allows customers to add Owner role to their account
 * Only visible to users with roles = ['customer']
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

export const BecomeOwnerButton: React.FC = () => {
    const { user, becomeOwner } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Don't render if user doesn't exist or already has owner role
    if (!user || user.roles?.includes('owner')) {
        return null;
    }

    const handleBecomeOwner = async () => {
        try {
            setLoading(true);
            await becomeOwner();
            setDialogOpen(false);
            // User will be redirected to owner dashboard by the context
        } catch (error) {
            console.error('❌ [BECOME OWNER] Failed:', error);
            alert('Failed to become an owner. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <Briefcase className="w-6 h-6" />
                        Become an Owner
                    </CardTitle>
                    <CardDescription>
                        Start earning by listing your items for rent
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                                List unlimited items (bikes, cars, cameras, drones, equipment)
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                                Earn passive income from your idle assets
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                                Keep your customer account - switch between modes anytime
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                                Complete KYC verification to start listing
                            </span>
                        </li>
                    </ul>
                </CardContent>

                <CardFooter>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardFooter>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Become an Owner?</DialogTitle>
                        <DialogDescription className="space-y-3 pt-2">
                            <p>
                                You're about to add <strong>Owner</strong> role to your account.
                            </p>
                            <p>
                                This will allow you to:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>List items for rent on GrabNGo</li>
                                <li>Manage your listings and bookings</li>
                                <li>Earn income from rentals</li>
                            </ul>
                            <p className="text-sm font-semibold text-green-700">
                                ✓ Your customer account will remain active
                            </p>
                            <p className="text-sm text-gray-600">
                                You'll need to complete Owner KYC verification before you can add listings.
                            </p>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBecomeOwner}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Processing...' : 'Yes, Become Owner'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
