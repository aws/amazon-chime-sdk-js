#!/usr/bin/env node

const { writeFileSync } = require('fs');
const { gitDescribeSync } = require('git-describe');
const path = require('path');

const description = JSON.stringify(gitDescribeSync(), null, 2);

console.log('Build description:', description);

// We write this as a TypeScript file so that:
// 1. Consumers don't need to add `resolveJsonFile` to their TypeScript config,
//    as they would for a .json file.
// 2. We don't need to fuss around with adding our own interface declarations, as
//    we would for a .js file.
const contents = 'export default ' + description + ';';
const out = path.join(__dirname, '../src/versioning/version.ts');

writeFileSync(out, contents);
