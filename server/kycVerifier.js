/**
 * KYC Face Verifier — Server-side only
 * Uses @vladmandic/face-api with @tensorflow/tfjs (pure JS, no native binaries) + canvas in Node.js
 *
 * ⛔ NEVER expose faceMatchDistance to client
 * ⛔ NEVER store face descriptors in DB
 * ✔  All face processing happens here, on the server
 */

'use strict';

// Use WASM backend — pure JS, no native compilation needed (avoids tfjs-node)
// @tensorflow/tfjs-backend-wasm is required by the node-wasm entry point
const path = require('path');
const { createCanvas, Image, ImageData } = require('canvas');
// Registers the WASM backend (no ready() here — called in loadModels before model load)
require('@tensorflow/tfjs-backend-wasm');
// Load the WASM-backed face-api build (no native binaries required)
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');

const MODELS_DIR = path.join(__dirname, 'models');

// Strict threshold: 0.5 (stricter than default 0.6)
const MATCH_THRESHOLD = 0.50;

let modelsLoaded = false;

/**
 * Monkey-patch face-api environment for Node.js (uses canvas instead of DOM).
 */
const patchEnv = () => {
    const canvasLib = require('canvas');
    faceapi.env.monkeyPatch({
        Canvas: canvasLib.Canvas,
        Image: canvasLib.Image,
        ImageData: canvasLib.ImageData,
    });
};

/**
 * Load all required face detection + recognition models.
 * Idempotent — safe to call multiple times.
 */
const loadModels = async () => {
    if (modelsLoaded) return;

    console.log('[KYC-VERIFIER] Loading face-api models from:', MODELS_DIR);

    // CRITICAL: WASM backend must be fully initialized before any tensor operations
    console.log('[KYC-VERIFIER] Initializing WASM backend...');
    await faceapi.tf.setBackend('wasm');
    await faceapi.tf.ready();
    console.log('[KYC-VERIFIER] WASM backend ready');

    patchEnv();

    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR),
    ]);

    modelsLoaded = true;
    console.log('[KYC-VERIFIER] ✅ All models loaded');
};

/**
 * Decode a base64 data URL into a canvas Image.
 * @param {string} base64DataUrl - e.g. "data:image/jpeg;base64,..."
 * @returns {Promise<Image>}
 */
const base64ToImage = (base64DataUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error('Failed to decode image: ' + err));

        if (base64DataUrl.startsWith('data:')) {
            img.src = base64DataUrl;
        } else {
            img.src = `data:image/jpeg;base64,${base64DataUrl}`;
        }
    });
};

/**
 * Extract 128-dimensional face descriptor from a base64 image.
 * @param {string} base64DataUrl
 * @returns {Promise<Float32Array|null>}
 */
const extractDescriptor = async (base64DataUrl) => {
    const img = await base64ToImage(base64DataUrl);

    const detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        console.warn('[KYC-VERIFIER] ⚠️ No face detected in image');
        return null;
    }

    console.log('[KYC-VERIFIER] ✅ Face descriptor extracted');
    return detection.descriptor;
};

/**
 * Main KYC verification function.
 *
 * @param {string} proofImageBase64
 * @param {string} liveImageBase64
 * @param {string} userId - for logging only
 *
 * @returns {Promise<{
 *   verified: boolean,
 *   reason: string,
 *   message: string,
 *   faceMatchDistance: number|null   ← stays SERVER-SIDE only
 * }>}
 */
const verifyKyc = async (proofImageBase64, liveImageBase64, userId) => {
    await loadModels();

    console.log(`[KYC-VERIFIER] 🔍 Starting verification for user: ${userId}`);

    // Step 1: Extract descriptors
    let proofDescriptor, liveDescriptor;

    try {
        proofDescriptor = await extractDescriptor(proofImageBase64);
    } catch (err) {
        console.error('[KYC-VERIFIER] ❌ Error processing proof image:', err.message);
        return {
            verified: false,
            reason: 'FACE_NOT_DETECTED',
            message: 'Could not process proof document image. Ensure the image is clear and well-lit.',
            faceMatchDistance: null,
        };
    }

    try {
        liveDescriptor = await extractDescriptor(liveImageBase64);
    } catch (err) {
        console.error('[KYC-VERIFIER] ❌ Error processing live photo:', err.message);
        return {
            verified: false,
            reason: 'FACE_NOT_DETECTED',
            message: 'Could not process live photo. Please try again in good lighting.',
            faceMatchDistance: null,
        };
    }

    // Step 2: Both images must have a detectable face
    if (!proofDescriptor) {
        console.log(`[KYC-VERIFIER] REJECTED — no face in proof document. User: ${userId}`);
        return {
            verified: false,
            reason: 'FACE_NOT_DETECTED',
            message: 'No face clearly visible in the proof document. Please upload a document that clearly shows your face.',
            faceMatchDistance: null,
        };
    }

    if (!liveDescriptor) {
        console.log(`[KYC-VERIFIER] REJECTED — no face in live photo. User: ${userId}`);
        return {
            verified: false,
            reason: 'FACE_NOT_DETECTED',
            message: 'No face clearly visible in the live photo. Please capture again facing the camera in good lighting.',
            faceMatchDistance: null,
        };
    }

    // Step 3: Compute Euclidean distance (server-side only — never returned to client)
    const distance = faceapi.euclideanDistance(proofDescriptor, liveDescriptor);
    console.log(`[KYC-VERIFIER] 📊 Distance: ${distance.toFixed(4)} | Threshold: ${MATCH_THRESHOLD} | User: ${userId}`);

    // Step 4: Decision
    const verified = distance < MATCH_THRESHOLD;

    if (verified) {
        console.log(`[KYC-VERIFIER] ✅ MATCH — User: ${userId}`);
        return {
            verified: true,
            reason: 'FACE_API_MATCH',
            message: 'Face verification successful.',
            faceMatchDistance: distance,
        };
    } else {
        console.log(`[KYC-VERIFIER] ❌ MISMATCH — User: ${userId}`);
        return {
            verified: false,
            reason: 'FACE_API_MISMATCH',
            message: 'Face verification failed. Please contact admin for manual review.',
            faceMatchDistance: distance,
        };
    }
};

module.exports = { loadModels, verifyKyc };
