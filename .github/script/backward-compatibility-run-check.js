#!/usr/bin/env node

/**
 * This script simply checks whether the version we are releasing is either the first NPM version for any new major version or
 * a beta version. For both, we do not want to run backward compatibility checks since both will have backward in-compatible breaking changes.
 * 
 * For e.g: 3.0.0, 3.0.0-beta.0, 4.0.0 and so on.
 */
 const { spawnOrFail } = require('../../script/cli-utils');

 // eslint-disable-next-line @typescript-eslint/no-var-requires
const versionToRelease = require('../../package.json').version;
const preReleaseName = (spawnOrFail('node', ['.github/script/get-pre-release-name'], { skipOutput: true })).trim();

// Check version to release if is a pre-release version or an first major version of a new major version.
// This satisfies versions like: 3.0.0, 4.0.0, 3.0.0-beta.0, 3.0.0-beta.1
if (versionToRelease.includes(preReleaseName)) {
  console.log(`Skipping backward compatibility checks for a pre release ${preReleaseName} version: ${versionToRelease}`);
  process.exit(1);
} else if ((/^[0-9]+\.0\.0$/g).test(versionToRelease)) {
  console.log(`Skipping backward compatibility checks for a new major version: ${versionToRelease}`);
  process.exit(1);
} else {
  console.log('Version to release should check the backward compatibility checks');
  process.exit(0);
}
