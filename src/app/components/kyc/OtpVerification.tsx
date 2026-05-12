/**
 * OTP Verification Component
 * Fallback verification when AI face matching fails
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Smartphone, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OtpVerificationProps {
    phone: string;
    onVerifySuccess: () => void;
    onResendOtp: () => Promise<void>;
    onVerifyOtp: (otp: string) => boolean;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({
    phone,
    onVerifySuccess,
    onResendOtp,
    onVerifyOtp,
}) => {
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Cooldown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-verify when 6 digits are entered
    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            toast.error('Please enter all 6 digits');
            return;
        }

        setIsVerifying(true);

        // Simulate slight delay for verification
        await new Promise(resolve => setTimeout(resolve, 500));

        const isValid = onVerifyOtp(otp);

        if (isValid) {
            toast.success('OTP verified successfully!');
            onVerifySuccess();
        } else {
            toast.error('Invalid OTP. Please try again.');
            setOtp('');
        }

        setIsVerifying(false);
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await onResendOtp();
            toast.success('New OTP sent successfully');
            setResendCooldown(60); // 60 second cooldown
            setOtp('');
        } catch (error) {
            toast.error('Failed to resend OTP');
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">AI Face Match Failed</p>
                        <p className="text-amber-800">
                            We couldn't verify your face automatically. Please enter the OTP sent to your phone number to continue.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg mb-2">Enter Verification Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                    We've sent a 6-digit code to <strong>{phone}</strong>
                </p>

                <div className="flex justify-center mb-4">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        disabled={isVerifying}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                {otp.length < 6 && !isVerifying && (
                    <p className="text-xs text-gray-500">
                        Enter the{' '}6-digit code from your phone
                    </p>
                )}

                {isVerifying && (
                    <p className="text-sm text-indigo-600 animate-pulse">
                        Verifying...
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Didn't receive the code?</span>
                <Button
                    variant="link"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-indigo-600"
                >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded text-xs text-center text-gray-600">
                💡 <strong>Tip:</strong> Check your browser console for the OTP code in demo mode
            </div>
        </div>
    );
};
