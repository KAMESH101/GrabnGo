/**
 * KYC Service
 * Central service for all KYC operations.
 *
 * NOTE: Face matching currently runs in the browser via face-api.js.
 * For production, move matchFaces() to a backend server.
 */

import { KycSubmission, KycStatus, User } from '../types';
import {
    createKycSubmission as createKycSubmissionDB,
    updateUserKycStatus,
} from './database';
import { matchFaces } from './faceMatching';
import { uploadKycDocumentToS3 } from './kycStorage';

/**
 * Submit Customer KYC
 */
export const submitCustomerKyc = async (
    user: User,
    proofDocumentDataUrl: string,
    livePhotoDataUrl: string
): Promise<KycSubmission> => {
    console.log('📝 [KYC] Starting Customer KYC submission for user:', user.id);

    // Step 1: Upload documents to storage
    const dlResult = await uploadKycDocumentToS3(
        proofDocumentDataUrl,
        user.id,
        'customer',
        'proof_document'
    );

    const livePhotoResult = await uploadKycDocumentToS3(
        livePhotoDataUrl,
        user.id,
        'customer',
        'live_photo'
    );

    console.log('✅ [KYC] Documents uploaded successfully');

    // Step 2: AI face matching (browser-side)
    let aiFaceMatch: boolean | undefined;
    let faceMatchError: string | undefined;

    try {
        const matchResult = await matchFaces(dlResult.url, livePhotoResult.url, user.id);
        aiFaceMatch = matchResult.match;
        faceMatchError = matchResult.error;
        console.log('✅ [KYC] AI face matching complete:', aiFaceMatch ? 'MATCH' : 'NO MATCH');
    } catch (error) {
        console.warn('⚠️ [KYC] AI face matching failed:', error);
        aiFaceMatch = undefined;
    }

    // Step 3: Set status based on face match result
    const finalStatus: KycStatus = aiFaceMatch === true ? 'verified' : 'rejected';

    // Step 4: Create KYC submission
    const submission: KycSubmission = {
        id: `KYC_CUSTOMER_${user.id}_${Date.now()}`,
        userId: user.id,
        role: 'customer',
        proofDocumentUrl: dlResult.url,
        livePhotoUrl: livePhotoResult.url,
        aiFaceMatch,
        status: finalStatus,
        submittedAt: new Date(),
        ...(finalStatus === 'verified' ? { reviewedAt: new Date() } : {}),
        rejectionReason: finalStatus === 'rejected' ? 'FACE_API_MISMATCH' : undefined,
    };

    const createdSubmission = createKycSubmissionDB(submission);

    // Step 5: Update user KYC status
    updateUserKycStatus(user.id, 'customer', finalStatus, createdSubmission);

    // Propagate user-facing error for KycModal
    if (finalStatus === 'rejected' && faceMatchError) {
        (createdSubmission as any)._faceMatchError = faceMatchError;
    }

    console.log('✅ [KYC] Customer KYC submitted → status:', finalStatus);
    return createdSubmission;
};

/**
 * Submit Owner KYC
 */
export const submitOwnerKyc = async (
    user: User,
    proofDocumentDataUrl: string,
    livePhotoDataUrl: string
): Promise<KycSubmission> => {
    console.log('📝 [KYC] Starting Owner KYC submission for user:', user.id);

    const dlResult = await uploadKycDocumentToS3(
        proofDocumentDataUrl,
        user.id,
        'owner',
        'proof_document'
    );

    const livePhotoResult = await uploadKycDocumentToS3(
        livePhotoDataUrl,
        user.id,
        'owner',
        'live_photo'
    );

    console.log('✅ [KYC] Documents uploaded successfully');

    let aiFaceMatch: boolean | undefined;
    let faceMatchError: string | undefined;

    try {
        const matchResult = await matchFaces(dlResult.url, livePhotoResult.url, user.id);
        aiFaceMatch = matchResult.match;
        faceMatchError = matchResult.error;
        console.log('✅ [KYC] AI face matching complete:', aiFaceMatch ? 'MATCH' : 'NO MATCH');
    } catch (error) {
        console.warn('⚠️ [KYC] AI face matching failed:', error);
        aiFaceMatch = undefined;
    }

    const finalStatus: KycStatus = aiFaceMatch === true ? 'verified' : 'rejected';

    const submission: KycSubmission = {
        id: `KYC_OWNER_${user.id}_${Date.now()}`,
        userId: user.id,
        role: 'owner',
        proofDocumentUrl: dlResult.url,
        livePhotoUrl: livePhotoResult.url,
        aiFaceMatch,
        status: finalStatus,
        submittedAt: new Date(),
        ...(finalStatus === 'verified' ? { reviewedAt: new Date() } : {}),
        rejectionReason: finalStatus === 'rejected' ? 'FACE_API_MISMATCH' : undefined,
    };

    const createdSubmission = createKycSubmissionDB(submission);
    updateUserKycStatus(user.id, 'owner', finalStatus, createdSubmission);

    if (finalStatus === 'rejected' && faceMatchError) {
        (createdSubmission as any)._faceMatchError = faceMatchError;
    }

    console.log('✅ [KYC] Owner KYC submitted → status:', finalStatus);
    return createdSubmission;
};

/**
 * Check if customer can rent products
 */
export const checkCustomerKycStatus = (user: User): boolean => {
    return user.customerKycStatus === 'verified';
};

/**
 * Check if owner can list products
 */
export const checkOwnerKycStatus = (user: User): boolean => {
    return user.ownerKycStatus === 'verified';
};

/**
 * Get KYC status message for display
 */
export const getKycStatusMessage = (status?: KycStatus): string => {
    switch (status) {
        case 'verified': return 'KYC Verified';
        case 'pending': return 'KYC Pending Approval';
        case 'rejected': return 'KYC Rejected';
        case 'not_submitted':
        default: return 'KYC Not Submitted';
    }
};
