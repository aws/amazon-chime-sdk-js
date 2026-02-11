#!/usr/bin/env node

/**
 * This script transpiles media transform worker TypeScript files into JavaScript code and generates a file that stores
 * the JavaScript code as a string which can be used to run a media transform worker. This script is meant to be run
 * before building the entire project so that the generated file also gets built.
 * 
 * The worker code is bundled inline (all classes concatenated) because Web Workers run in isolation
 * and cannot use module imports from the main thread.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary tsconfig file to transpile media transform worker files.
const configDir = 'config';
const workerTsconfig = 'tsconfig.mediatransformworker.json';
const workerTsconfigContent = `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "es2015",
    "moduleResolution": "node",
    "outDir": "../build/mediatransformworker",
    "rootDir": "../src",
    "tsBuildInfoFile": "./tsconfig.mediatransformworker.tsbuildinfo",
    "incremental": true,
    "composite": false
  },
  "include": [
    "../src/encodedtransformworker/**/*.ts"
  ]
}
`;
fs.writeFileSync(`${configDir}/${workerTsconfig}`, workerTsconfigContent);

function runCommandWithLogs(command) {
  try {
    console.log(`Running command: ${command}`);
    const output = execSync(command).toString();
    console.log(output);
    return output;
  } catch (error) {
    console.log(error.stdout.toString());
    console.error(error.toString());
    process.exit(1);
  }
}

// Transpile media transform worker TypeScript files.
// Note: prebuild runs via npm lifecycle before build, so node_modules is already available
let tscPath = path.resolve(`${execSync('npm root').toString().trim()}/.bin/tsc`);
runCommandWithLogs(`${tscPath} --build config/${workerTsconfig}`);

// Remove the temporary tsconfig file.
fs.unlinkSync(`${configDir}/${workerTsconfig}`);

// Read all transpiled worker files and bundle them inline
// Order matters: dependencies must come before classes that use them
const buildDir = './build/mediatransformworker/encodedtransformworker';
const workerFiles = [
  'EncodedTransform.js',
  'RedundantAudioEncodedTransform.js',
  'MediaMetricsEncodedTransform.js',
  'EncodedTransformWorker.js',
];

/**
 * Strip module syntax from ES module JavaScript file.
 * 
 * Removes relative import/export statements since everything is in the same file.
 */
function stripModuleSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove import statements
  content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  
  // Remove export default statements
  content = content.replace(/^export\s+default\s+/gm, '');
  
  // Remove export { ... } statements
  content = content.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
  
  // Remove export keyword from class/function declarations
  content = content.replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ');
  
  // Clean up empty lines
  content = content.replace(/^\s*[\r\n]/gm, '');
  
  return content.trim();
}

// Bundle all classes
let bundledCode = '// Bundled media transform worker code\n';
bundledCode += '"use strict";\n\n';

for (const file of workerFiles) {
  const filePath = path.join(buildDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`Bundling: ${file}`);
    const classCode = stripModuleSyntax(filePath);
    bundledCode += `// === ${file} ===\n`;
    bundledCode += classCode + '\n\n';
  } else {
    console.error(`Warning: ${filePath} not found`);
  }
}

// Add initialization code
bundledCode += `// Initialize worker
EncodedTransformWorker.initializeWorker();
`;

// Escape the code for embedding in a string
const escapedCode = bundledCode
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r');

// Generate the TypeScript file that contains the worker code string
const workerFileContent = `// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This file was generated with the \`generate-media-transform-worker-code.js\` script.
 *
 * The worker code is bundled inline (all classes concatenated) because Web Workers
 * run in isolation and cannot use module imports from the main thread.
 */

/**
 * Encoded transform worker code string.
 */
// eslint-disable-next-line
const EncodedTransformWorkerCode = "${escapedCode}";

export default EncodedTransformWorkerCode;
`;

// Create the output directory if it doesn't exist
const workerDir = './src/encodedtransformworkercode';
if (!fs.existsSync(workerDir)) fs.mkdirSync(workerDir, { recursive: true });

// Write the generated worker code file
const workerFile = 'EncodedTransformWorkerCode.ts';
fs.writeFileSync(`${workerDir}/${workerFile}`, workerFileContent);

console.log(`Successfully generated ${workerDir}/${workerFile}`);
