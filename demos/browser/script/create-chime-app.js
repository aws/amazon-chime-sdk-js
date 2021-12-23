#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const { logger, spawnOrFail, process } = require('./cli-utils');

// Parse arguments.
let destination = path.join(__dirname, '..');
(function parseArgs() {
  function getArgOrExit(i, args) {
    if (i >= args.length) {
      logger.error('Too few arguments');
      process.exit(1);
    }
    return args[i];
  }

  const args = process.argv.slice(2);
  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '-d':
      case '--destination':
        destination = getArgOrExit(++i, args);
        break;
      default:
        logger.error(`Invalid argument ${args[i]}`);
        process.exit(1);
    }
    ++i;
  }
})();

// Clone the Chime SDK for JavaScript repository that uses the latest NPM version.
const sdkVersion = spawnOrFail('npm', [`show amazon-chime-sdk-js version`]).trim();
const demoPath = path.join(destination, `demo_${sdkVersion.replace('.', '_')}_${Date.now()}`);
fs.mkdirSync(demoPath);
process.chdir(demoPath);
spawnOrFail('git', [
  `clone --branch v${sdkVersion} https://github.com/aws/amazon-chime-sdk-js.git`,
]);
const repoPath = path.join(demoPath, 'amazon-chime-sdk-js');
const browserPath = path.join(repoPath, 'demos', 'browser');
const serverlessPath = path.join(repoPath, 'demos', 'serverless');

// Use the NPM version of the Chime SDK for JavaScript.
process.chdir(browserPath);
spawnOrFail('npm', [`install -S amazon-chime-sdk-js@${sdkVersion}`]);
fs.removeSync(path.join(browserPath, 'node_modules'));

// Remove the "deps" script in package.json.
const packageJSON = JSON.parse(fs.readFileSync(path.join(browserPath, 'package.json'), 'utf-8'));
packageJSON.scripts.deps = '';
fs.writeFileSync('package.json', JSON.stringify(packageJSON, null, 2));

// Clone the TS config from the root directory.
const demoTSConfigJSON = JSON.parse(
  fs.readFileSync(path.join(browserPath, 'tsconfig.json'), 'utf-8')
);
demoTSConfigJSON.extends = './tsconfig.base.json';
fs.writeFileSync('tsconfig.json', JSON.stringify(demoTSConfigJSON, null, 2));
fs.copySync(
  path.join(repoPath, 'config', 'tsconfig.base.json'),
  path.join(browserPath, 'tsconfig.base.json')
);

// Organize demo packages.
fs.moveSync(browserPath, path.join(demoPath, 'browser'), { overwrite: true });
fs.moveSync(serverlessPath, path.join(demoPath, 'serverless'), { overwrite: true });
fs.removeSync(repoPath);
