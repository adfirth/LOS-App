#!/usr/bin/env node

// Simple build script to copy necessary files to dist folder
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files and directories to copy
const filesToCopy = [
  'config',
  'assets', 
  'pages',
  'index.html',
  'netlify'
];

console.log('🔧 Starting build process...');

// Copy each file/directory
filesToCopy.forEach(item => {
  const source = path.join(__dirname, item);
  const destination = path.join(distDir, item);
  
  if (fs.existsSync(source)) {
    if (fs.lstatSync(source).isDirectory()) {
      // Copy directory recursively
      copyDir(source, destination);
      console.log(`✅ Copied directory: ${item}`);
    } else {
      // Copy file
      fs.copyFileSync(source, destination);
      console.log(`✅ Copied file: ${item}`);
    }
  } else {
    console.log(`⚠️ Skipping: ${item} (not found)`);
  }
});

console.log('✅ Build process complete!');

// Helper function to copy directories recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}



