/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Razorpay configuration
    readonly VITE_RAZORPAY_KEY_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
