#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('fs');
const { gitDescribeSync } = require('git-describe');
const exec = require('child_process').execSync;
const path = require('path');

function manuallyCreateDescription() {
  // Probably not a checkout. This is what you'll get if you use
  // "Download ZIP" in the GitHub UI.
  // Synthesize a version file
  // from the current package.json.

  const package = readFileSync(path.join(__dirname, '../package.json'));
  const version = JSON.parse(package).version;
  console.log(`Using synthetic build description with version ${version}.`)

  description = JSON.stringify({
    hash: 'gdeadbeef',
    raw: 'v' + version,
    semverString: version,
    tag: 'v' + version,
  });
}
try {
  exec(`git fetch --tags https://github.com/aws/amazon-chime-sdk-js`);
} catch (e) {
  console.error(`Unable to fetch tags from the master branch: ${e}`);
}

let description;
try {
  description = JSON.stringify(gitDescribeSync(), null, 2);
} catch (e) {
  console.log(`Got error ${e} getting description of current version.`);
  console.log('For an accurate version number, or for distribution, please use a full Git checkout of this repository.');
  manuallyCreateDescription();
}

console.log('Build description:', description);

// We write this as a TypeScript file so that:
// 1. Consumers don't need to add `resolveJsonFile` to their TypeScript config,
//    as they would for a .json file.
// 2. We don't need to fuss around with adding our own interface declarations, as
//    we would for a .js file.
const contents = 'export default ' + description + ';';
const out = path.join(__dirname, '../src/versioning/version.ts');

writeFileSync(out, contents);
