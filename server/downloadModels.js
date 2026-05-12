/**
 * Model Installer
 * Copies face-api.js model files directly from the installed @vladmandic/face-api npm package.
 * No internet download needed — models are bundled with the npm package.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PKG_MODELS = path.join(__dirname, 'node_modules', '@vladmandic', 'face-api', 'model');
const DEST_MODELS = path.join(__dirname, 'models');

// Only the models needed for face detection + landmark + recognition
const REQUIRED_MODEL_FILES = [
    // SSD MobileNet V1 (face detector)
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model.bin',
    // Face Landmark 68
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.bin',
    // Face Recognition (128-dim embeddings)
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.bin',
];

const downloadModels = () => {
    if (!fs.existsSync(DEST_MODELS)) {
        fs.mkdirSync(DEST_MODELS, { recursive: true });
        console.log('[MODELS] Created models directory:', DEST_MODELS);
    }

    console.log('[MODELS] Checking face-api.js model files...');

    let copied = 0;
    let missing = [];

    for (const fileName of REQUIRED_MODEL_FILES) {
        const src = path.join(PKG_MODELS, fileName);
        const dst = path.join(DEST_MODELS, fileName);

        if (fs.existsSync(dst)) {
            continue; // already there
        }

        if (!fs.existsSync(src)) {
            missing.push(fileName);
            continue;
        }

        fs.copyFileSync(src, dst);
        console.log(`[MODELS] Copied: ${fileName}`);
        copied++;
    }

    if (missing.length > 0) {
        console.error('[MODELS] ❌ Missing source files in npm package:', missing);
        throw new Error(`Could not find model files in ${PKG_MODELS}: ${missing.join(', ')}`);
    }

    if (copied === 0) {
        console.log('[MODELS] ✅ All model files already present');
    } else {
        console.log(`[MODELS] ✅ Copied ${copied} model file(s) successfully`);
    }
};

module.exports = { downloadModels };

if (require.main === module) {
    try {
        downloadModels();
    } catch (err) {
        console.error('[MODELS] ❌ Failed:', err.message);
        process.exit(1);
    }
}
