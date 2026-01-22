import { AuditLog } from '../types';

// Demo AWS S3 configuration
const S3_BUCKET_NAME = 'grabngo-customer-photos-demo';
const S3_PRODUCT_IMAGES_BUCKET = 'grabngo-product-images-demo';
const S3_REGION = 'ap-south-1'; // Mumbai region for India
const S3_BASE_URL = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com`;
const S3_PRODUCT_BASE_URL = `https://${S3_PRODUCT_IMAGES_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// In-memory storage for demo (simulates S3)
const demoStorage = new Map<string, { url: string; bookingId: string; uploadedAt: Date }>();
const demoProductStorage = new Map<string, { url: string; listingId: string; uploadedAt: Date }>();

/**
 * Upload product image to S3 (Demo mode)
 * In production, this would use AWS SDK to upload to actual S3 bucket
 */
export const uploadProductImageToS3 = async (
  imageDataUrl: string,
  listingId: string,
  imageIndex: number
): Promise<{ s3Key: string; url: string }> => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate S3 key with folder structure
  const timestamp = Date.now();
  const s3Key = `product-images/${listingId}/${imageIndex}_${timestamp}.jpg`;
  const url = `${S3_PRODUCT_BASE_URL}/${s3Key}`;

  // Store in demo storage
  demoProductStorage.set(s3Key, {
    url: imageDataUrl, // In demo, we store the data URL
    listingId,
    uploadedAt: new Date(),
  });

  console.log('[DEMO MODE] Product image uploaded to S3:', {
    bucket: S3_PRODUCT_IMAGES_BUCKET,
    region: S3_REGION,
    key: s3Key,
    url,
    size: `${Math.round(imageDataUrl.length / 1024)} KB`,
    encryption: 'AES-256',
    acl: 'public-read'
  });

  return { s3Key, url: imageDataUrl }; // Return data URL for demo
};

/**
 * Upload multiple product images to S3
 */
export const uploadProductImagesToS3 = async (
  imageDataUrls: string[],
  listingId: string
): Promise<string[]> => {
  const uploadPromises = imageDataUrls.map((dataUrl, index) =>
    uploadProductImageToS3(dataUrl, listingId, index)
  );

  const results = await Promise.all(uploadPromises);
  return results.map(result => result.url);
};

/**
 * Delete product images from S3 (when listing is deleted)
 */
export const deleteProductImagesFromS3 = async (
  listingId: string
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  // Find and delete all images for this listing
  const keysToDelete: string[] = [];
  for (const [key, data] of demoProductStorage.entries()) {
    if (data.listingId === listingId) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => demoProductStorage.delete(key));

  console.log('[DEMO MODE] Product images deleted from S3:', {
    bucket: S3_PRODUCT_IMAGES_BUCKET,
    listing_id: listingId,
    images_deleted: keysToDelete.length,
    keys: keysToDelete
  });
};

/**
 * Upload customer photo to S3 (Demo mode)
 * In production, this would use AWS SDK to upload to actual S3 bucket
 */
export const uploadCustomerPhotoToS3 = async (
  photoDataUrl: string,
  bookingId: string,
  customerId: string
): Promise<{ s3Key: string; url: string }> => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate S3 key with folder structure
  const timestamp = Date.now();
  const s3Key = `customer-photos/${bookingId}/${customerId}_${timestamp}.jpg`;
  const url = `${S3_BASE_URL}/${s3Key}`;

  // Store in demo storage
  demoStorage.set(s3Key, {
    url: photoDataUrl, // In demo, we store the data URL
    bookingId,
    uploadedAt: new Date(),
  });

  console.log('[DEMO MODE] Photo uploaded to S3:', {
    bucket: S3_BUCKET_NAME,
    region: S3_REGION,
    key: s3Key,
    url,
    size: `${Math.round(photoDataUrl.length / 1024)} KB`,
    encryption: 'AES-256',
    acl: 'private'
  });

  return { s3Key, url };
};

/**
 * Retrieve customer photo from S3 (Demo mode)
 */
export const getCustomerPhotoFromS3 = async (s3Key: string): Promise<string | null> => {
  // Simulate retrieval delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const photoData = demoStorage.get(s3Key);
  
  if (!photoData) {
    console.log('[DEMO MODE] Photo not found in S3:', { key: s3Key });
    return null;
  }

  console.log('[DEMO MODE] Photo retrieved from S3:', {
    key: s3Key,
    booking_id: photoData.bookingId,
    uploaded_at: photoData.uploadedAt
  });

  return photoData.url;
};

/**
 * Delete customer photo from S3 (Demo mode - called on rental completion)
 */
export const deleteCustomerPhotoFromS3 = async (
  s3Key: string,
  bookingId: string
): Promise<AuditLog> => {
  // Simulate deletion delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const photoData = demoStorage.get(s3Key);
  
  if (photoData) {
    demoStorage.delete(s3Key);
  }

  const auditLog: AuditLog = {
    id: `audit_${Date.now()}`,
    bookingId,
    action: 'photo_deleted',
    performedBy: 'system_auto_deletion',
    details: `Customer photo automatically deleted from S3 on rental completion. S3 Key: ${s3Key}`,
    timestamp: new Date(),
  };

  console.log('[DEMO MODE] Photo deleted from S3:', {
    bucket: S3_BUCKET_NAME,
    key: s3Key,
    booking_id: bookingId,
    reason: 'rental_completed',
    audit_log_id: auditLog.id,
    deleted_at: auditLog.timestamp
  });

  return auditLog;
};

/**
 * Check if customer photo exists for a booking
 */
export const checkPhotoExists = async (s3Key: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return demoStorage.has(s3Key);
};

/**
 * Get photo access URL with expiry (Demo mode)
 * In production, this would generate a pre-signed URL with expiry
 */
export const getPresignedPhotoUrl = async (
  s3Key: string,
  expiryMinutes: number = 60
): Promise<string | null> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  const photoData = demoStorage.get(s3Key);
  
  if (!photoData) {
    return null;
  }

  const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
  const presignedUrl = `${S3_BASE_URL}/${s3Key}?X-Amz-Expires=${expiryMinutes * 60}&X-Amz-Signature=demo_sig_${Math.random().toString(36).substring(7)}`;

  console.log('[DEMO MODE] Pre-signed URL generated:', {
    key: s3Key,
    expires_in: `${expiryMinutes} minutes`,
    expires_at: new Date(expiryTime).toISOString()
  });

  return photoData.url; // Return actual data URL in demo mode
};

/**
 * Create audit log for photo-related actions
 */
export const createPhotoAuditLog = (
  bookingId: string,
  action: 'photo_captured' | 'photo_deleted' | 'payment_success' | 'booking_approved' | 'booking_rejected' | 'rental_completed',
  performedBy: string,
  details: string
): AuditLog => {
  const auditLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    bookingId,
    action,
    performedBy,
    details,
    timestamp: new Date(),
  };

  console.log('[DEMO MODE] Audit log created:', auditLog);

  return auditLog;
};

/**
 * List all photos for a booking (Admin use)
 */
export const listBookingPhotos = async (bookingId: string): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const photos: string[] = [];
  
  for (const [key, data] of demoStorage.entries()) {
    if (data.bookingId === bookingId) {
      photos.push(key);
    }
  }

  console.log('[DEMO MODE] Listed photos for booking:', {
    booking_id: bookingId,
    photo_count: photos.length,
    keys: photos
  });

  return photos;
};