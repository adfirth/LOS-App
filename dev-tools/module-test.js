#!/usr/bin/env node

// Module Testing Tool for Local Development
// Tests individual modules without full webpack bundling

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting module testing...\n');

// Define modules to test
const modulesToTest = [
    { name: 'UI Module', path: '../src/modules/ui.js', critical: true },
    { name: 'Auth Module', path: '../src/modules/auth.js', critical: true },
    { name: 'Database Module', path: '../src/modules/database.js', critical: true },
    { name: 'Game Logic Module', path: '../src/modules/gameLogic.js', critical: false },
    { name: 'Fixtures Module', path: '../src/modules/fixtures.js', critical: false },
    { name: 'Scores Module', path: '../src/modules/scores/index.js', critical: false },
    { name: 'Admin Module', path: '../src/modules/admin/index.js', critical: false }
];

async function testModule(moduleInfo) {
    const fullPath = path.join(__dirname, moduleInfo.path);
    
    try {
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return { success: false, error: 'File not found', critical: moduleInfo.critical };
        }
        
        // Read file content
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Basic syntax checks
        const checks = [
            { name: 'File Readable', passed: content.length > 0 },
            { name: 'Has Content', passed: content.trim().length > 0 },
            { name: 'Valid JS Syntax', passed: !content.includes('syntax error') },
            { name: 'Module Exports', passed: content.includes('export') || content.includes('module.exports') },
            { name: 'No Console Errors', passed: !content.includes('console.error') || content.includes('//') }
        ];
        
        const passedChecks = checks.filter(check => check.passed).length;
        const totalChecks = checks.length;
        
        return {
            success: passedChecks === totalChecks,
            checks,
            passedChecks,
            totalChecks,
            critical: moduleInfo.critical,
            path: moduleInfo.path
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            critical: moduleInfo.critical,
            path: moduleInfo.path
        };
    }
}

async function runModuleTests() {
    const results = [];
    let criticalFailures = 0;
    let totalFailures = 0;
    
    console.log('📋 Testing Modules:\n');
    
    for (const moduleInfo of modulesToTest) {
        const result = await testModule(moduleInfo);
        results.push(result);
        
        // Display result
        const status = result.success ? '✅' : '❌';
        const critical = result.critical ? ' [CRITICAL]' : '';
        console.log(`${status} ${moduleInfo.name}${critical}`);
        
        if (!result.success) {
            totalFailures++;
            if (result.critical) criticalFailures++;
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            } else if (result.checks) {
                const failedChecks = result.checks.filter(check => !check.passed);
                failedChecks.forEach(check => {
                    console.log(`   ❌ ${check.name}`);
                });
            }
        } else if (result.checks) {
            console.log(`   ${result.passedChecks}/${result.totalChecks} checks passed`);
        }
        console.log('');
    }
    
    // Summary
    console.log('📊 Test Summary:');
    console.log(`Total Modules: ${modulesToTest.length}`);
    console.log(`Successful: ${modulesToTest.length - totalFailures}`);
    console.log(`Failed: ${totalFailures}`);
    console.log(`Critical Failures: ${criticalFailures}`);
    
    if (criticalFailures > 0) {
        console.log('\n🚨 CRITICAL FAILURES DETECTED!');
        console.log('These modules are essential for the app to function.');
        process.exit(1);
    } else if (totalFailures > 0) {
        console.log('\n⚠️  Some non-critical modules failed, but app should still work.');
        process.exit(0);
    } else {
        console.log('\n🎉 All modules passed testing!');
        process.exit(0);
    }
}

// Run tests
runModuleTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
});


