#!/usr/bin/env node

// Fast Testing Script for Local Development
// This script creates a quick local build for testing without full deployment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting fast local test build...');

async function fastTest() {
    try {
        const startTime = Date.now();
        
        // Create minimal environment config for local testing
        const envConfig = `// Local testing environment configuration
window.LOCAL_ENV = {
    RAPIDAPI_KEY: '${process.env.RAPIDAPI_KEY || 'local-test-key'}',
    BUILD_TIME: '${new Date().toISOString()}',
    ENVIRONMENT: 'local-test'
};

console.log('🔧 Local testing environment loaded');
console.log('🔑 API Key available:', !!window.LOCAL_ENV.RAPIDAPI_KEY);
`;
        
        // Write local environment config
        const envConfigPath = path.join(__dirname, '..', 'config', 'local-env.js');
        fs.writeFileSync(envConfigPath, envConfig);
        console.log(`✅ Local environment config written to ${envConfigPath}`);
        
        // Run fast development build
        console.log('📦 Running fast development build...');
        execSync('npm run build:fast', { stdio: 'inherit' });
        
        const buildTime = Date.now() - startTime;
        console.log(`\n✅ Fast test build completed in ${buildTime}ms`);
        console.log('🌐 Open dist/index.html in your browser to test');
        console.log('💡 Use "npm run test:serve" for live development server');
        
    } catch (error) {
        console.error('❌ Error in fast test build:', error);
        process.exit(1);
    }
}

fastTest();
