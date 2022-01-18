#!/usr/bin/env node

const version = require('../../package.json').version;
const preRelease = version.split('-');
if (preRelease[1]) {
  console.log(preRelease[1].split('.')[0]);
} else {
  console.log('');
}