#!/usr/bin/env node

/**
 * This script sets up the amazon-chime-sdk-js new version release into the previous version release tagged demo so that we can run backward compatibility checks.
 * Note that, this script will only be triggered if the new version release is not a beta version or not the first major version of a new major version.
 * 
 * For e.g: For 3.0.0, 3.0.0-beta.0, 4.0.0 and so on this script would not run and it will run when we release 2.29.0, 2.30.0, 3.1,0 and so on.
 */
 const { logger, spawnOrFail, path } = require('./cli-utils');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const versionToRelease = require('../package.json').version;
logger.log(`We are releasing a new version: ${versionToRelease}`);

logger.log('Building package...');
spawnOrFail('npm', ['run build']);
logger.log('Building done!');

logger.log('Packaging...');
spawnOrFail('npm', ['pack']);
logger.log('Packaging done!');

const previousRelease = (spawnOrFail('node', ['.github/script/get-prev-version'], { skipOutput: true })).trim();
logger.log(`Previous release version: ${previousRelease}`);

logger.log(`Checking out tags/v${previousRelease} for installing the new SDK version in previous release demo.`);
spawnOrFail('git', [`fetch --all --tags`]);
spawnOrFail('git', [`checkout tags/v${previousRelease}`]);

logger.log(`Changing directory into demos/browser.`);
process.chdir(path.join(__dirname, '../demos/browser'));

logger.log(`Installing new ${versionToRelease} into ${previousRelease} browser demo.`);
spawnOrFail('npm', ['uninstall amazon-chime-sdk-js']);
spawnOrFail('npm', [`install ../../amazon-chime-sdk-js-${versionToRelease}.tgz`]);
logger.log('Installing done.');
