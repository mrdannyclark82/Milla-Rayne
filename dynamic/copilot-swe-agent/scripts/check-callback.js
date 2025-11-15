#!/usr/bin/env node
// Simple script to check if the callback wrapper is correctly configured.
const path = require('path');
const fs = require('fs');

const wrapperPath = path.join(__dirname, '../src/callback-wrapper.js');

if (!fs.existsSync(wrapperPath)) {
  console.error('❌ callback-wrapper.js not found at:', wrapperPath);
  process.exit(1);
}

try {
  const { sendCallback } = require(wrapperPath);
  if (typeof sendCallback !== 'function') {
    console.error('❌ sendCallback is not a function');
    process.exit(1);
  }
  console.log('✅ callback-wrapper.js is correctly configured');
  console.log('✅ sendCallback function is available');
  process.exit(0);
} catch (err) {
  console.error('❌ Error loading callback-wrapper:', err.message);
  process.exit(1);
}
