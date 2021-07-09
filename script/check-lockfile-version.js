#!/usr/bin/env node

const lockFileVersion = require('../package-lock.json').lockfileVersion;

if (lockFileVersion === 2) {
  process.exit(0);
} else {
  console.log(`In-correct package-lock verson detected, should be 2, found ${lockFileVersion}`);
  console.log('Check if you are using npm v7, if not update to npm v7 and re-run build:release');
  process.exit(1);
}