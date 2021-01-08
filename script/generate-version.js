#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('fs');
const git = require('git-rev-sync');
const path = require('path');

const package = readFileSync(path.join(__dirname, '../package.json'));
const version = JSON.parse(package).version;

let hash;
try {
  hash = git.short();
} catch {
  console.error(`Unable to fetch the current commit hash`);
  hash = `gdeadbeef`
}

let description = JSON.stringify({
  hash: hash,
  raw: 'v' + version,
  semverString: version,
}, null, 2);
console.log('Build description:', description);

// We write this as a TypeScript file so that:
// 1. Consumers don't need to add `resolveJsonFile` to their TypeScript config,
//    as they would for a .json file.
// 2. We don't need to fuss around with adding our own interface declarations, as
//    we would for a .js file.
const contents = 'export default ' + description + ';';
const out = path.join(__dirname, '../src/versioning/version.ts');

writeFileSync(out, contents);
