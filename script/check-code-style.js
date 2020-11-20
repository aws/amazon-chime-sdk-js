#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = require('child_process').execSync;

let exitCode = 0;

const ignoreMemo = {};
const isIgnored = (file) => {
  if (file in ignoreMemo) {
    return ignoreMemo[file];
  }
  try {
    // If this returns zero, it means the file is ignored by git; skip it.
    exec(`git check-ignore -q '${file}'`);
    ignoreMemo[file] = true;
    return true;
  } catch (e) {
    // It's tracked by git.
    ignoreMemo[file] = false;
    return false;
  }
};

const walk = (dir) => {
  let results = [];
  if (dir.includes('.DS_Store')) {
    return results;
  }

  const list = fs.readdirSync(dir);
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

const failed = (file, reason, description) => {
  console.error('Failed:', file, reason);
  if (description) {
    console.error(description);
  }
  exitCode = 1;
};

const components = () => {
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

const tests = () => {
  return walk('test')
    .filter(file => file.endsWith('.test.ts'))
    .sort();
};

const allFiles = () => {
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

  if (isIgnored(file)) {
    return;
  }

  const fileText = fs.readFileSync(file, 'utf-8').toString();
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
  if (isIgnored(component)) {
    return;
  }

  if (component === 'voicefocus') {
    // This rule does not make sense for Voice Focus.
    return;
  }

  let hasMatchingInterface = false;
  const componentDir = path.join('src', component);
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
  if (isIgnored(component)) {
    return;
  }

  const componentDir = path.join('src', component);
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

const spdx = '// SPDX-License-Identifier: Apache-2.0';

let allYears = [];

allFiles().forEach(file => {
  if (file.endsWith('.d.ts') || isIgnored(file)) {
    return;
  }

  const copyright = `// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.`;
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

    // Exclude demos and comment lines. Some of our block comments
    // include code examples that refer to console.log.
    if (fileLines[i].includes('console.log') &&
        !fileLines[i].match(/^\s+(?:\*|\/[\*\/])/) &&
        !file.includes('demos/')) {
      failed(pos, 'contains console.log: ' + fileLines[i], 'Ensure that source does not contain console.log');
    }
  }
});

const footerCopyright = `\nCopyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\n`;

for (const file of ['README.md', 'NOTICE']) {
  if (
    !fs
      .readFileSync(file)
      .toString()
      .endsWith(footerCopyright)
  ) {
    failed(file, `Ensure that ${file} ends with the following copyright: ${footerCopyright}`);
  }
}

process.exit(exitCode);
