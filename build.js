#!/usr/bin/env node

// Custom build script to avoid permission issues with Vite binary
const { spawn } = require('child_process');
const path = require('path');

// Run Vite build using Node.js directly
const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

console.log('Starting Vite build...');

const buildProcess = spawn('node', [vitePath, 'build'], {
  stdio: 'inherit',
  cwd: __dirname
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Build completed successfully!');
    process.exit(0);
  } else {
    console.error(`Build failed with exit code ${code}`);
    process.exit(code);
  }
});

buildProcess.on('error', (error) => {
  console.error('Build error:', error);
  process.exit(1);
});
