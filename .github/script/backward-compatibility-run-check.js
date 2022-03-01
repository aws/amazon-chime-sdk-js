#!/usr/bin/env node

/**
 * This script simply checks whether the version we are releasing is either the first NPM version for any new major version or
 * a beta version. For both, we do not want to run backward compatibility checks since both will have backward in-compatible breaking changes.
 * 
 * For e.g: 3.0.0, 3.0.0-beta.0, 4.0.0 and so on.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const versionToRelease = require('../../package.json').version;
if (versionToRelease.includes('beta') || (/^[0-9]+\.0\.0$/g).test(versionToRelease)) {
  console.log('no');
} else {
  console.log('yes');
}
