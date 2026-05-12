/**
 * KYC Storage Service - Extension of main storage service
 * Handles KYC document uploads
 */

// Demo AWS S3 configuration for KYC
const S3_KYC_BUCKET = 'grabngo-kyc-documents-demo';
const S3_REGION = 'ap-south-1';
const S3_KYC_BASE_URL = `https://${S3_KYC_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// In-memory storage for demo (simulates S3)
const demoKycStorage = new Map<string, { url: string; userId: string; uploadedAt: Date }>();

/**
 * Upload KYC document to S3 (Demo mode)
 * Used for proof documents and live photos
 */
export const uploadKycDocumentToS3 = async (
    documentDataUrl: string,
    userId: string,
    role: 'customer' | 'owner',
    documentType: 'proof_document' | 'live_photo'
): Promise<{ s3Key: string; url: string }> => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate S3 key with folder structure
    const timestamp = Date.now();
    const s3Key = `kyc-documents/${role}/${userId}/${documentType}_${timestamp}.jpg`;
    const url = `${S3_KYC_BASE_URL}/${s3Key}`;

    // Store in demo storage
    demoKycStorage.set(s3Key, {
        url: documentDataUrl, // In demo, we store the data URL
        userId,
        uploadedAt: new Date(),
    });

    console.log('[DEMO MODE] KYC document uploaded to S3:', {
        bucket: S3_KYC_BUCKET,
        region: S3_REGION,
        key: s3Key,
        url,
        role,
        documentType,
        size: `${Math.round(documentDataUrl.length / 1024)} KB`,
        encryption: 'AES-256',
        acl: 'private'
    });

    return { s3Key, url: documentDataUrl }; // Return data URL for demo
};

/**
 * Retrieve KYC document from S3 (Demo mode)
 */
export const getKycDocumentFromS3 = async (s3Key: string): Promise<string | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const docData = demoKycStorage.get(s3Key);

    if (!docData) {
        console.log('[DEMO MODE] KYC document not found in S3:', { key: s3Key });
        return null;
    }

    console.log('[DEMO MODE] KYC document retrieved from S3:', {
        key: s3Key,
        user_id: docData.userId,
        uploaded_at: docData.uploadedAt
    });

    return docData.url;
};
