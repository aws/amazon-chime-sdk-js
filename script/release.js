#!/usr/bin/env node

const { versionBump, currentVersion, isPreRelease }  = require('./version-utils');
const { logger, spawnOrFail, prompt, shouldContinuePrompt, quit, process, path } = require('./cli-utils');

const currentBranch = (spawnOrFail('git', [' branch --show-current'], { skipOutput: true })).trim();

const deployDemo = (version) => {
  const formattedVersion = `${version.replace(/\./g, "-")}`;
  process.chdir(path.join(__dirname, '../demos/serverless'));
  const meetingDemoName = `chime-sdk-demo-global-${formattedVersion}`;
  logger.log(`Deploying ${meetingDemoName} ...`);
  spawnOrFail('npm', [`run deploy -- -b ${meetingDemoName} -s ${meetingDemoName} -o chime-sdk-demo-global -u false`], { printErr: true });
  const meetingDemoNameRegional = `chime-sdk-demo-${formattedVersion}-regional`;
  logger.log(`Deploying ${meetingDemoNameRegional} ...`);
  spawnOrFail('npm', [`run deploy -- -b ${meetingDemoNameRegional} -s ${meetingDemoNameRegional} -o chime-sdk-demo-regional`], { printErr: true });
  const readinessCheckerDemoName = `chime-sdk-meeting-readiness-checker-${formattedVersion}`;
  logger.log(`Deploying ${readinessCheckerDemoName} ...`);
  spawnOrFail('npm', [`run deploy -- -b ${readinessCheckerDemoName} -s ${readinessCheckerDemoName} -a meetingReadinessChecker -u false`], { printErr: true });
};

const getCurrentRemoteBranch = () => {
  return (spawnOrFail('git', ['for-each-ref --format="%(upstream:short)" "$(git symbolic-ref -q HEAD)"'], { skipOutput: true })).trim();
};

const buildAndPack = () => {
  logger.log('Building package...');
  spawnOrFail('npm', ['run build:release']);
  logger.log('Packaging ...');
  spawnOrFail('npm', ['pack --dry-run'], { printErr: true });
};

const cleanUp = async (remoteBranch) => {
  logger.warn(`Warning: Resetting HEAD${remoteBranch ? ` to ${remoteBranch}` : ''}.\nAll current staged and local changes will be lost.`);
  await shouldContinuePrompt();
  spawnOrFail('git', [`reset --hard ${remoteBranch ? remoteBranch : ''}`]);
  spawnOrFail('git', [' clean -ffxd .']);
};

const release = async () => {
  spawnOrFail('git', ['fetch origin'], { skipOutput: true });
  const remoteBranch = getCurrentRemoteBranch();
  if (!remoteBranch || (remoteBranch !== 'origin/main' && !(/^origin\/release-[0-9]+\.x$/).test(remoteBranch))) {
    logger.error(`The local branch ${currentBranch} does not track either main or release-<version>.x branch`);
    quit(1);
  }

  await cleanUp(remoteBranch);

  buildAndPack();

  logger.log(`Do you want to upload these files to release-${currentVersion} branch?\n`);
  await shouldContinuePrompt();
  spawnOrFail('git', [`push origin HEAD:release-${currentVersion} -f`]);

  deployDemo(currentVersion);

  //Bump next development version
  await versionBump();
};

const hotfix = async () => {
  if (isPreRelease(currentVersion)) {
    logger.error(`We currently do not do hotfix for pre-release version.`);
    quit(1);
  }
  await cleanUp();
  const newVersion = await versionBump(1, 'hotfix');
  buildAndPack();
  deployDemo(newVersion);
};

const main = async () => {
  logger.log('Choose one of the following options:');
  logger.log('  1. Release');
  logger.log('  2. Hotfix');
  logger.log('  3. Deploy demo');
  const option = await prompt('');

  switch (option) {
    case '1':
      await release();
      break;
    case '2':
      await hotfix();
      break;
    case '3':
      const remoteBranch = getCurrentRemoteBranch();
      if (!remoteBranch || (!(remoteBranch.includes('origin/release-')) && (remoteBranch !== 'origin/hotfix'))) {
        logger.error(`The local branch ${currentBranch} does not track either release or hotfix branch`);
        quit(1);
      }
      await cleanUp(remoteBranch);
      spawnOrFail('npm', ['install']);
      deployDemo(currentVersion);
      break;
    default:
      if (option) {
        logger.error('Invalid option');
      }
      quit(1);
  }
};

main();
