import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    getKycSubmissionsByRole,
    getKycSubmissionsByStatus,
    updateKycSubmissionStatus,
    updateUserKycStatus,
    getUserById,
} from '../../services/database';
import { KycSubmission, KycStatus } from '../../types';
import { CheckCircle, XCircle, Clock, AlertTriangle, User, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

type FilterStatus = 'all' | KycStatus;

export const CustomerKycReview: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [selectedSubmission, setSelectedSubmission] = useState<KycSubmission | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Redirect if not admin
        if (user?.role !== 'admin') {
            navigate('/admin/login');
            return;
        }

        loadData();
    }, [user, navigate, filterStatus]);

    const loadData = () => {
        const allSubmissions = getKycSubmissionsByRole('customer');

        if (filterStatus === 'all') {
            setSubmissions(allSubmissions);
        } else {
            setSubmissions(allSubmissions.filter(s => s.status === filterStatus));
        }
    };

    const handleApprove = async (submission: KycSubmission) => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // Update submission status
            updateKycSubmissionStatus(
                submission.id,
                'verified',
                user?.id,
                undefined
            );

            // Update user KYC status
            updateUserKycStatus(
                submission.userId,
                'customer',
                'verified',
                submission
            );

            toast.success('Customer KYC approved successfully');
            loadData();
        } catch (error) {
            console.error('Failed to approve KYC:', error);
            toast.error('Failed to approve KYC submission');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectClick = (submission: KycSubmission) => {
        setSelectedSubmission(submission);
        setRejectionReason('');
        setIsRejectDialogOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedSubmission || !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // Update submission status
            updateKycSubmissionStatus(
                selectedSubmission.id,
                'rejected',
                user?.id,
                rejectionReason
            );

            // Update user KYC status
            updateUserKycStatus(
                selectedSubmission.userId,
                'customer',
                'rejected'
            );

            toast.success('Customer KYC rejected');
            setIsRejectDialogOpen(false);
            setSelectedSubmission(null);
            setRejectionReason('');
            loadData();
        } catch (error) {
            console.error('Failed to reject KYC:', error);
            toast.error('Failed to reject KYC submission');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: KycStatus) => {
        const badges = {
            not_submitted: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Not Submitted' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
            verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Verified' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
        };
        const badge = badges[status];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                <Icon className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const getMatchIndicator = (match?: boolean) => {
        if (match === undefined) return null;

        return match ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                AI Match: Success
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                AI Match: Failed
            </span>
        );
    };

    const pendingCount = getKycSubmissionsByStatus('pending').filter(s => s.role === 'customer').length;

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Customer KYC Review</h1>
                    <p className="text-gray-600 mt-2">
                        KYC submissions are <strong>auto-verified</strong> when face matching succeeds. Manually review or reject submissions here.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-2">
                    {(['all', 'pending', 'verified', 'rejected'] as FilterStatus[]).map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'default' : 'outline'}
                            onClick={() => setFilterStatus(status)}
                            className="capitalize"
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </Button>
                    ))}
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-gray-500">
                                No {filterStatus !== 'all' && filterStatus} customer KYC submissions found
                            </CardContent>
                        </Card>
                    ) : (
                        submissions.map((submission) => {
                            const submittedUser = getUserById(submission.userId);

                            return (
                                <Card key={submission.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <CardTitle className="text-lg">{submittedUser?.name || 'Unknown User'}</CardTitle>
                                                    <p className="text-sm text-gray-500">{submittedUser?.email}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {submittedUser?.roles?.map((role) => (
                                                            <span
                                                                key={role}
                                                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${role === 'customer'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : role === 'owner'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-gray-100 text-gray-700'
                                                                    } ${submittedUser?.activeRole === role ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                                                            >
                                                                {role}
                                                                {submittedUser?.activeRole === role && ' ⭐'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {submittedUser?.roles?.includes('owner') && (
                                                        <a
                                                            href={`/admin/kyc/owner?userId=${submittedUser.id}`}
                                                            className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                                                        >
                                                            Owner KYC: {submittedUser.ownerKycStatus || 'not_submitted'}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            {getStatusBadge(submission.status)}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Proof Document */}
                                            <div>
                                                <h3 className="font-semibold mb-2">Proof Document</h3>
                                                <div className="border rounded-lg overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
                                                    <img
                                                        src={submission.proofDocumentUrl}
                                                        alt="Proof Document"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>

                                            {/* Live Photo */}
                                            <div>
                                                <h3 className="font-semibold mb-2">Live Photo</h3>
                                                <div className="border rounded-lg overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
                                                    <img
                                                        src={submission.livePhotoUrl}
                                                        alt="Live Photo"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Submitted</p>
                                                    <p className="font-medium">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                                                </div>

                                                {submission.reviewedAt && (
                                                    <div>
                                                        <p className="text-gray-600">Reviewed</p>
                                                        <p className="font-medium">{new Date(submission.reviewedAt).toLocaleDateString()}</p>
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="text-gray-600">AI Verification</p>
                                                    <div className="mt-1">{getMatchIndicator(submission.aiFaceMatch)}</div>
                                                </div>
                                            </div>

                                            {/* Admin-only face match details */}
                                            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Admin — Face Match Details</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Distance Score (Euclidean)</p>
                                                        <p className="font-mono font-semibold text-gray-800">
                                                            {submission.faceMatchDistance !== undefined && submission.faceMatchDistance !== null
                                                                ? (<span className={submission.faceMatchDistance < 0.5 ? 'text-green-700' : 'text-red-600'}>
                                                                    {submission.faceMatchDistance.toFixed(4)}
                                                                    <span className="text-xs text-gray-500 ml-1">(threshold: 0.50)</span>
                                                                </span>)
                                                                : <span className="text-gray-400 italic">N/A</span>
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Verification Method</p>
                                                        <p className="font-medium text-gray-800 text-xs">
                                                            {submission.kycVerificationMethod || <span className="text-gray-400 italic">Unknown</span>}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Match Result</p>
                                                        {submission.aiFaceMatch === true && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold">
                                                                <CheckCircle className="w-3 h-3" /> MATCHED
                                                            </span>
                                                        )}
                                                        {submission.aiFaceMatch === false && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                                                                <XCircle className="w-3 h-3" /> NOT MATCHED
                                                            </span>
                                                        )}
                                                        {submission.aiFaceMatch === undefined && (
                                                            <span className="text-gray-400 text-xs italic">Pending</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {submission.rejectionReason && (
                                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                                                    <p className="text-sm text-red-700 mt-1">{submission.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions — admin can reject auto-verified or approve pending */}
                                        {submission.status === 'verified' && submission.aiFaceMatch === true && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <p className="text-sm text-green-800 font-medium">
                                                    AI Auto-Verified — account activated instantly. No admin action needed.
                                                </p>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="ml-auto"
                                                    onClick={() => handleRejectClick(submission)}
                                                    disabled={isProcessing}
                                                >
                                                    <XCircle className="w-3 h-3 mr-1" /> Override & Reject
                                                </Button>
                                            </div>
                                        )}
                                        {submission.status === 'pending' && (
                                            <div className="mt-6 flex gap-3">
                                                <Button
                                                    onClick={() => handleApprove(submission)}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleRejectClick(submission)}
                                                    disabled={isProcessing}
                                                    className="flex-1"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject KYC Submission</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This will be visible to the user.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="reason">Rejection Reason *</Label>
                            <Textarea
                                id="reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Document image is unclear, face does not match, etc."
                                rows={4}
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsRejectDialogOpen(false)}
                                className="flex-1"
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRejectConfirm}
                                className="flex-1"
                                disabled={isProcessing || !rejectionReason.trim()}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
