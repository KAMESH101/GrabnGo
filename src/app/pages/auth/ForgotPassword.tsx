import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getUserByEmail } from '../../services/database';

export const ForgotPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'customer';

    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [emailVerified, setEmailVerified] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    // Role-based styling
    const isCustomer = role === 'customer';
    const gradientColors = isCustomer ? 'from-indigo-50 to-blue-50' : 'from-green-50 to-emerald-50';
    const buttonClass = isCustomer ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700';
    const linkClass = isCustomer ? 'text-indigo-600' : 'text-green-600';

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setVerifyingEmail(true);
        try {
            const existingUser = getUserByEmail(email);
            if (!existingUser) {
                toast.error('No account found with this email');
                return;
            }

            setEmailVerified(true);
            toast.success('Email verified! Now set your new password.');
        } catch (error: any) {
            toast.error(error.message || 'Verification failed.');
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword) {
            toast.error('Please enter a new password');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setResettingPassword(true);
        try {
            await resetPassword(email, newPassword);
            toast.success('Password reset successful! Please login with your new password.');
            navigate(`/${role}/login`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to reset password.');
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${gradientColors} flex items-center justify-center p-4`}>
            <div className="w-full max-w-md">
                <BackButton to={`/${role}/login`} label="Back to Login" className="mb-4" />

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Forgot Password
                        </CardTitle>
                        <CardDescription>
                            {!emailVerified
                                ? 'Enter your email to reset your password'
                                : 'Enter your new password'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!emailVerified ? (
                            <form onSubmit={handleVerifyEmail} className="space-y-4">
                                <div>
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className={`w-full ${buttonClass}`}
                                    disabled={verifyingEmail}
                                >
                                    {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <Label htmlFor="newPassword" className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Enter new password (min 8 characters)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className={`w-full ${buttonClass}`}
                                    disabled={resettingPassword}
                                >
                                    {resettingPassword ? 'Resetting Password...' : 'Reset Password'}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Remember your password?{' '}
                                <a href={`/${role}/login`} className={`${linkClass} hover:underline`}>
                                    Back to Login
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
