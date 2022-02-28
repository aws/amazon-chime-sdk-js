#!/usr/bin/env node

const { logger, spawnOrFail, prompt, shouldContinuePrompt, quit, fs, path } = require('./cli-utils');
const currentVersion = require('../package.json').version;

const isPreRelease = (version) => {
  //Check whether there is a build version at the end (e.g., 3.0.0-beta.0)
  return version.split('.')[3] >= 0;
};

// Return the next version from the current version based on the inputs.
// For pre-release candidate, the current option is Beta which will add beta after the patch version, separated by a
// hyphen, following by the build number. (e.g, 3.0.0-beta.0).
const getNewVersion = (currentVersion, versionIncrement) => {
  const verArr = currentVersion.split('.');
  const isBeta = isPreRelease(currentVersion);

  switch (versionIncrement) {
    case 1: // Patch
      if (isBeta) {
        logger.error(`ERROR: Cannot increase patch in pre-release version `);
        return undefined;
      }
      verArr[2] = Number(verArr[2]) + 1;
      return verArr.join('.');
    case 2: // Minor
      if (isBeta) {
        logger.error(`ERROR: Cannot increase patch in pre-release version `);
        return undefined;
      }
      verArr[1] = Number(verArr[1]) + 1;
      verArr[2] = 0;
      return verArr.join('.');
    case 3: // Major
      if (isBeta) {
        return currentVersion.split('-')[0];
      }
      verArr[0] = Number(verArr[0]) + 1;
      verArr[1] = 0;
      verArr[2] = 0;
      return verArr.join('.');
    case 4: // Beta (e.g., 3.0.0-beta.0)
      if (isBeta) { // Already a beta version then just increase the build number at the end
        verArr[3] = Number(verArr[3]) + 1;
        return verArr.join('.');
      }
      verArr[0] = Number(verArr[0]) + 1;
      verArr[1] = 0;
      verArr[2] = 0;
      return verArr.join('.') + '-beta.0';
    default:
      logger.error(`ERROR: Invalid input: ${versionIncrement}`);
      return undefined;
  }
};

// Add an entry for the new version in CHANGELOG.md
const updateChangelog = (newVersion) => {
  logger.log(`Updating CHANGELOG.md with a new release entry - ${newVersion}`);
  const filePath = path.resolve(__dirname, '../CHANGELOG.md');
  let changeLog = fs.readFileSync(filePath).toString();
  const latestEntryIndex = changeLog.indexOf('## [');
  const newEntry = `## [${newVersion}] - ${new Date().toISOString().slice(0, 10)}
    \n### Added
    \n### Removed
    \n### Changed
    \n### Fixed
    \n`;
  changeLog = changeLog.substring(0, latestEntryIndex) + newEntry + changeLog.substring(latestEntryIndex);
  fs.writeFileSync(filePath, changeLog);
};

// Update the base branch to point to a new branch.
// For example, base branch for release-2.x should be origin/release-2.x
const updateBaseBranch = (branchName) => {
  logger.log(`Updating the base branch in .base-branch to ${branchName}`);
  const filePath = path.resolve(__dirname, '../.base-branch');
  fs.writeFileSync(filePath, `origin/${branchName}`);
}

const versionBump = async (option, branchName) => {
  process.chdir(path.join(__dirname, '..'));
  if (!option) {
    logger.log('Choose one of the following options to bump the next version:');
    logger.log('  1. Patch');
    logger.log('  2. Minor');
    logger.log('  3. Major');
    logger.log('  4. Beta');
    option = Number(await prompt(''));
  }
  const newVersion = getNewVersion(currentVersion, option);
  if (!newVersion) {
    quit(1);
  }

  branchName = branchName ? branchName : `version-bump-${newVersion}`;

  const prevReleaseBranch = !isPreRelease(currentVersion) && (option === 3 || option === 4)
    ? `release-${currentVersion.split('.')[0]}.x`
    : '';

  logger.warn('Warning: you are bumping the version\n');
  logger.warn(`  From: ${currentVersion}\n`);
  logger.warn(`  To: ${newVersion}\n`);
  if (prevReleaseBranch) {
    logger.warn(`  This will also create ${prevReleaseBranch} branch.`);
  }
  await shouldContinuePrompt();

  if (prevReleaseBranch) {
    const currentBranch = (spawnOrFail('git', [' branch --show-current'], { skipOutput: true })).trim();
    spawnOrFail('git', [`checkout -b ${prevReleaseBranch}`]);
    updateBaseBranch(prevReleaseBranch);
    spawnOrFail('git', ['add -A']);
    spawnOrFail('git', [`commit -m "Update base branch to ${prevReleaseBranch}"`]);
    spawnOrFail('git', [`push origin HEAD:${prevReleaseBranch} -f`]);
    logger.log(`Branch ${prevReleaseBranch} is created. Please make sure to set branch protection.`);

    // Switch back to the local branch
    spawnOrFail('git', [`checkout ${currentBranch}`]);
  }

  spawnOrFail('npm', [`version ${newVersion} --no-git-tag-version`]);
  updateChangelog(newVersion);

  logger.log('Committing version bump...');
  spawnOrFail('git', ['add -A']);
  spawnOrFail('git', [`commit -m "Version bump for amazon-chime-sdk-js@${newVersion}"`]);
  logger.log(`Do you want to upload these files to ${branchName} branch?\n`);
  await shouldContinuePrompt();
  spawnOrFail('git', [`push origin HEAD:${branchName} -f`]);
  if (branchName === 'version-bump') {
    logger.log('Please create a pull request to merge the version bump to main.');
  }
  return newVersion;
};

module.exports = {
  versionBump,
  currentVersion,
  isPreRelease
};
