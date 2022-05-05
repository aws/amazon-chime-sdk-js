#!/usr/bin/env node

const { spawnOrFail } = require('../../script/cli-utils');
const version = require('../../package.json').version;
const release = version.split('-');
if (release[1]) {
  // For example, 3.0.0-beta.0
  console.log(release[1].split('.')[0]);
} else {
  // For example, '3.1.0'
  const npmLatestVersion = spawnOrFail('npm',['view', 'amazon-chime-sdk-js@latest', 'version'], { skipOutput: true }).trim();
  const npmLatestMajorVersion = npmLatestVersion.split('.')[0];
  const majorVersionToRelease = version.split('.')[0];
  if (majorVersionToRelease < npmLatestMajorVersion) {
    console.log(`stable-v${majorVersionToRelease}`);
  } else {
    console.log('latest');
  }
}
