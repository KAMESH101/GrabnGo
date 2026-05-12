/**
 * Face Matching Service using face-api.js (browser-side)
 * Provides AI-powered face verification for KYC
 *
 * NOTE: For production, move this to a backend server.
 * Models are loaded from jsDelivr CDN on first use.
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models from CDN
 */
export const loadFaceApiModels = async (): Promise<void> => {
    if (modelsLoaded) {
        console.log('✅ [FACE-API] Models already loaded');
        return;
    }

    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

    try {
        console.log('🧠 [FACE-API] Loading face detection models...');
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded = true;
        console.log('✅ [FACE-API] All models loaded successfully');
    } catch (error) {
        console.error('❌ [FACE-API] Failed to load models:', error);
        throw error;
    }
};

/**
 * Compare faces from two base64 image URLs.
 * Returns match=true if the Euclidean distance is below the threshold (0.6).
 *
 * @param proofDocumentUrl  - URL or base64 of the proof document image
 * @param livePhotoUrl      - URL or base64 of the live photo
 * @returns { match: boolean, error?: string }
 */
export const matchFaces = async (
    proofDocumentUrl: string,
    livePhotoUrl: string,
    _userId?: string  // reserved for future backend integration
): Promise<{ match: boolean; error?: string }> => {
    if (!modelsLoaded) {
        await loadFaceApiModels();
    }

    try {
        const THRESHOLD = 0.6; // distance threshold (lower = stricter)

        // Detect face + descriptor in proof document
        const proofImg = await faceapi.fetchImage(proofDocumentUrl);
        const proofDetection = await faceapi
            .detectSingleFace(proofImg, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!proofDetection) {
            console.warn('[FACE-API] No face detected in proof document');
            return { match: false, error: 'No face clearly visible in the proof document. Please upload a document that shows your face.' };
        }

        // Detect face + descriptor in live photo
        const liveImg = await faceapi.fetchImage(livePhotoUrl);
        const liveDetection = await faceapi
            .detectSingleFace(liveImg, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!liveDetection) {
            console.warn('[FACE-API] No face detected in live photo');
            return { match: false, error: 'No face clearly visible in the live photo. Please try again in good lighting.' };
        }

        // Compare descriptors
        const distance = faceapi.euclideanDistance(
            proofDetection.descriptor,
            liveDetection.descriptor
        );

        const match = distance < THRESHOLD;
        console.log(`[FACE-API] Distance: ${distance.toFixed(4)} | Threshold: ${THRESHOLD} | Match: ${match}`);

        return { match };
    } catch (error) {
        console.error('[FACE-API] Face matching error:', error);
        return {
            match: false,
            error: 'Face verification encountered an error. Please try again.',
        };
    }
};
