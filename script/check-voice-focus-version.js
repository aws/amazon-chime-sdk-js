#!/usr/bin/env node

const https = require('https');
const version = require('../package.json').version;

console.log('Checking assets for version', version);

const majorMinor = version.split('.', 2).join('.');

const url = `https://static.sdkassets.chime.aws/workers/NOTICES.txt?assetGroup=sdk-${majorMinor}`;

console.log('Fetching', url);

https.get(url, res => {
  if (res.statusCode === 200) {
    console.log('Got 200. Success!');
    process.exit(0);
  } else {
    console.error('Got result', res.statusCode);
    process.exit(1);
  }
});