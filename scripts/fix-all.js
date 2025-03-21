#!/usr/bin/env node

/**
 * This script runs ESLint and Prettier fixes across the entire codebase
 * Usage: node scripts/fix-all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const options = { stdio: 'inherit', cwd: root };

console.log('🔍 Running ESLint to fix linting issues...');
execSync('npm run lint:fix', options);

console.log('\n💅 Running Prettier to format code...');
execSync('npm run format', options);

console.log('\n✅ All fixes applied successfully!');
console.log('\nTo install any missing ESLint plugins, run:');
console.log('npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-import @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier'); 