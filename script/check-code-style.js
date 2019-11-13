#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
let exitCode = 0;

let walk = function(dir) {
  let results = [];
  if (dir.includes('.DS_Store')) {
    return results;
  }
  let list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
};

let failed = function(file, reason, description) {
  console.error('Failed:', file, reason);
  if (description) {
    console.error(description);
  }
  exitCode = 1;
};

let warned = function(file, reason, description) {
  console.error('Failed:', file, reason);
  if (description) {
    console.error(description);
  }
};

let components = function() {
  return fs
    .readdirSync('src')
    .filter(
      dir =>
        path.basename(dir) !== 'index.ts' &&
        !path.basename(dir).startsWith('.') &&
        !path.basename(dir).includes('signalingprotocol') &&
        !path.basename(dir).includes('screensignalingprotocol')
    );
};

let tests = function() {
  return walk('test')
    .filter(file => file.endsWith('.test.ts'))
    .sort();
};

let allFiles = function() {
  const srcFiles = walk('src').filter(
    file => file.endsWith('.ts') && path.basename(file) !== 'index.ts'
  );
  const testFiles = walk('test').filter(file => file.endsWith('.ts'));
  const demosFiles = walk('demos/browser/app').filter(
    file => file.endsWith('.ts') || file.endsWith('.js')
  );
  return srcFiles.concat(testFiles).concat(demosFiles);
};

tests().forEach(file => {
  if (file === 'test/global/Global.test.ts') {
    return;
  }
  if (file.includes(`.DS_Store`)) {
    return;
  }
  const fileText = fs.readFileSync(file, 'utf-8').toString();
  if (fileText.includes('sinon.stub')) {
    failed(
      file,
      'uses sinon.stub',
      'Avoid using stubs as they do not test functionality end-to-end'
    );
  }
  if (fileText.includes('not.equal.null')) {
    failed(
      file,
      'contains not.equal.null',
      'Avoid using not.equal.null and convert it to assert.exists'
    );
  }

  const srcFile = file.replace(/^test/, 'src').replace('.test.ts', '.ts');
  if (!fs.existsSync(srcFile)) {
    const errorString = 'Ensure that a test file has a corresponding source file.';
    failed(
      file,
      'does not have a corresponding source file',
      errorString +
        `\nFor example, the test file (${file}) should test the corresponding source file (${srcFile})`
    );
  }

  const basename = path.basename(file, '.test.ts');
  let describeCount = 0;

  const lines = fileText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^describe\(/)) {
      ++describeCount;
    }
  }
  if (describeCount !== 1) {
    const errorString = 'Ensure that each test file has one top-level describe';
    failed(file, 'has more than one top-level describe', errorString);
  } else if (!fileText.includes(`describe\(\'${basename}\'`)) {
    console.log(`^describe\(\'${basename}\'`);
    failed(
      file,
      'has an invalid top-level describe name',
      `Ensure that the top-level describe name matches the filename excluding .test.ts.\nFor example, it should be ""`
    );
  }
});

components().forEach(component => {
  if (component.includes('.DS_Store')) {
    return;
  }
  let hasMatchingInterface = false;
  let componentDir = path.join('src', component);
  walk(componentDir).forEach(file => {
    if (
      path.basename(file, '.ts').toLowerCase() === path.basename(componentDir) ||
      path.basename(file, 'ComponentFactory.ts').toLowerCase() === path.basename(componentDir) ||
      path.basename(file, '.d.ts').toLowerCase() === path.basename(componentDir)
    ) {
      hasMatchingInterface = true;
    }
  });

  if (!hasMatchingInterface) {
    failed(
      componentDir,
      'component does not have matching interface',
      'Ensure that each component directory has an interface of the same name. \nFor example, src/foobar will have an interface src/foobar/FooBar.ts.'
    );
  }
});

components().forEach(component => {
  if (component.includes('.DS_Store')) {
    return;
  }
  let componentDir = path.join('src', component);
  fs.readdirSync(componentDir).forEach(file => {
    let filePath = path.join(componentDir, file);
    if (path.basename(filePath, '.ts').toLowerCase() !== path.basename(componentDir)) {
      // not a interface
      return;
    }
    let fileText = fs.readFileSync(filePath, 'utf-8').toString();
    let lines = fileText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()[0] !== '*') {
        let commentStartRegex = new RegExp(/\s+\w+\(.*[:]/);
        if (commentStartRegex.test(lines[i])) {
          if (lines[i - 1].trim() !== '*/') {
            failed(
              component,
              `interface ${file} method ${lines[i].trim()} is missing comment`,
              'Ensure that each interface method has a comment explaining what it does and information about the possible inputs and expected outputs.'
            );
          }
        }
      }
    }
  });
});

let foundYear = false;
const currentYear = new Date().getFullYear().toString();
const existingYears = ['2019'];

for (const pastYear of existingYears) {
  if (pastYear === currentYear) {
    foundYear = true;
    break;
  }
}

if (!foundYear) {
  warned(
    `Please update the copyright to contain the current year ${new Date().getFullYear().toString()}`
  );
}

const copyright = `// Copyright ${existingYears.join(
  ', '
)} Amazon.com, Inc. or its affiliates. All Rights Reserved.`;
const spdx = '// SPDX-License-Identifier: Apache-2.0';

allFiles().forEach(file => {
  if (file.endsWith('.d.ts') || file.includes('.DS_Store')) {
    return;
  }
  const fileLines = fs
    .readFileSync(file)
    .toString()
    .split('\n');

  if (fileLines[0].trim() !== copyright) {
    failed(
      `${file}:1`,
      'header does not include correct copyright',
      `Ensure that header contains the following copyright: ${copyright}`
    );
  }

  if (fileLines[1].trim() !== spdx) {
    failed(
      `${file}:1`,
      'header does not include correct SPDX license code',
      `Ensure that header contains the following copyright: ${spdx}`
    );
  }

  if (fileLines[2].trim() !== '') {
    failed(
      `${file}:3`,
      'copyright file header is not followed by blank line',
      'Ensure that header is followed by a blank line'
    );
  }

  for (let i = 0; i < fileLines.length; i++) {
    const pos = `${file}:${i + 1}`;
    if (fileLines[i].includes('console.log') && !file.includes('demos/')) {
      failed(pos, 'contains console.log', 'Ensure that source does not contain console.log');
    }
  }
});

process.exit(exitCode);
