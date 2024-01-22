#!/usr/bin/env node

const lockFileVersion = require('../package-lock.json').lockfileVersion;

if (lockFileVersion !== 1) {
  process.exit(0);
} else {
  console.log('Incorrect package-lock version detected. Version 1 is not supported.');
  console.log(
    'Please check if you are using npm v8 or higher. If not, update to npm v8 or higher and re-run build:release'
  );
  process.exit(1);
}
