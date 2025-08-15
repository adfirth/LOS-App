// Environment Configuration for Client-Side Usage
// This file handles environment variables for the browser context

// Environment variables that should be available in the browser
const ENV_CONFIG = {
    // RapidAPI Configuration
    RAPIDAPI_KEY: null, // Will be set from environment variable or fallback
    
    // Firebase Configuration (if needed for client-side)
    FIREBASE_API_KEY: 'AIzaSyBn2RvXmQ8mfDHrBQal1h5MRFVsOxsqgks',
    FIREBASE_AUTH_DOMAIN: 'alty-jfc-los.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'alty-jfc-los',
    FIREBASE_STORAGE_BUCKET: 'alty-jfc-los.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: '40979114514',
    FIREBASE_APP_ID: '1:40979114514:web:850676ff855b372d4806cb'
};

// Development API key fallback
const DEV_API_KEY = '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef';

// Function to get environment variable
function getEnvVar(key) {
    // Check if we're in a Node.js environment (Netlify functions)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    
    // For browser environment, check multiple possible sources
    if (typeof window !== 'undefined') {
        // Check if the environment variable is available in window object
        if (window[key]) {
            return window[key];
        }
        
        // Check if there's a global environment variables object
        if (window.ENV && window.ENV[key]) {
            return window.ENV[key];
        }
        
        // Check if there's a config object with the key
        if (window.CONFIG && window.CONFIG[key]) {
            return window.CONFIG[key];
        }
        
        // Check for Vite-style environment variables (if available)
        if (window.import && window.import.meta && window.import.meta.env && window.import.meta.env[key]) {
            return window.import.meta.env[key];
        }
    }
    
    return null;
}

// Initialize environment configuration
function initializeEnvConfig() {
    console.log('🔧 Initializing environment configuration...');
    
    // Try to get RapidAPI key from environment variables
    let rapidApiKey = getEnvVar('VITE_RAPIDAPI_KEY');
    
    // If no environment variable, try alternative names
    if (!rapidApiKey) {
        rapidApiKey = getEnvVar('RAPIDAPI_KEY');
    }
    
    // If still no API key, use the dev key as fallback
    if (!rapidApiKey) {
        rapidApiKey = DEV_API_KEY;
        console.warn('⚠️ Using development API key - set VITE_RAPIDAPI_KEY environment variable for production');
    }
    
    // Set the API key in the config
    ENV_CONFIG.RAPIDAPI_KEY = rapidApiKey;
    
    // Expose configuration to window object
    if (typeof window !== 'undefined') {
        window.ENV_CONFIG = ENV_CONFIG;
        window.RAPIDAPI_KEY = rapidApiKey; // For backward compatibility
        
        console.log('✅ Environment configuration loaded');
        console.log('🔑 API Key status:', rapidApiKey === DEV_API_KEY ? '⚠️ Using development key' : '✅ API key configured');
        console.log('🔑 API Key value:', rapidApiKey.substring(0, 10) + '...');
    }
}

// Initialize immediately if in browser context
if (typeof window !== 'undefined') {
    initializeEnvConfig();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ENV_CONFIG, 
        getEnvVar, 
        initializeEnvConfig 
    };
}
