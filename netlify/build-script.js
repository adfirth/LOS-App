#!/usr/bin/env node

// Netlify Build Script
// This script injects environment variables into the client-side code
// Run during Netlify build process

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Netlify build script...');

// Function to inject environment variables into a JavaScript file
function injectEnvVars(filePath, envVars) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Create a script that sets environment variables in the browser
        const envScript = `
// Environment variables injected by Netlify build script
window.ENV_CONFIG = window.ENV_CONFIG || {};
${Object.entries(envVars).map(([key, value]) => `window.ENV_CONFIG['${key}'] = '${value}';`).join('\n')}
window.RAPIDAPI_KEY = '${envVars.VITE_RAPIDAPI_KEY || envVars.RAPIDAPI_KEY || ''}';
console.log('✅ Environment variables injected:', Object.keys(window.ENV_CONFIG));
`;

        // Insert the environment script at the beginning of the file
        content = envScript + '\n' + content;
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Environment variables injected into ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Error injecting environment variables into ${filePath}:`, error);
    }
}

// Main build process
async function main() {
    try {
        // Get environment variables
        const envVars = {
            VITE_RAPIDAPI_KEY: process.env.VITE_RAPIDAPI_KEY,
            RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
            FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
            FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
            FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
            FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
        };

        console.log('🔑 Environment variables found:', Object.keys(envVars).filter(key => envVars[key]));

        // Files to inject environment variables into
        const filesToInject = [
            'config/env-config.js',
            'config/football-webpages-config.js'
        ];

        // Inject environment variables into each file
        for (const file of filesToInject) {
            if (fs.existsSync(file)) {
                injectEnvVars(file, envVars);
            } else {
                console.warn(`⚠️ File not found: ${file}`);
            }
        }

        console.log('✅ Netlify build script completed successfully');

    } catch (error) {
        console.error('❌ Error in Netlify build script:', error);
        process.exit(1);
    }
}

// Run the build script
main();
