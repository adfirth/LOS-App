#!/usr/bin/env node

/**
 * Git Safety Check Script
 * 
 * This script helps prevent accidental pushes to the main branch.
 * Run this before committing to ensure you're on the correct branch.
 */

const { execSync } = require('child_process');

function getCurrentBranch() {
    try {
        const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        return branch;
    } catch (error) {
        console.error('Error getting current branch:', error.message);
        return null;
    }
}

function checkBranchSafety() {
    const currentBranch = getCurrentBranch();
    
    if (!currentBranch) {
        console.error('❌ Could not determine current branch');
        process.exit(1);
    }
    
    console.log(`🌿 Current branch: ${currentBranch}`);
    
    if (currentBranch === 'main') {
        console.error('❌ WARNING: You are on the main branch!');
        console.error('❌ This branch is for production only.');
        console.error('❌ Please switch to the development branch:');
        console.error('   git checkout refactor/complete-modularization');
        console.error('');
        console.error('❌ If you need to make changes, do them on the development branch first.');
        process.exit(1);
    }
    
    if (currentBranch === 'refactor/complete-modularization') {
        console.log('✅ You are on the development branch - safe to commit!');
        console.log('✅ Your changes will be deployed to the preview environment.');
        return;
    }
    
    console.log('⚠️  You are on a different branch. Make sure this is intentional.');
    console.log('⚠️  Recommended: Use refactor/complete-modularization for development.');
}

// Run the check
checkBranchSafety();
