// CLI utilities from https://github.com/aws/amazon-chime-sdk-component-library-react

const exec = require('child_process').spawnSync;
const process = require('process');
const util = require('util');
const prompt = require('prompt-sync')();
const YES = 'yes';

const logger = {
  error: (output, info = '') => console.error('\x1b[31m%s\x1b[0m', output, info), // Red
  log: output => console.log('\x1b[36m%s\x1b[0m', output), // Teal
  warn: output => console.warn('\x1b[33m%s\x1b[0m', output), // Yellow
};

const spawnOrFail = (command, args, options) => {
  options = {
    ...options,
    shell: true,
  };
  const cmd = exec(command, args, options);
  if (cmd.error) {
    logger.log(`Command ${command} failed with ${cmd.error.code}`);

    process.exit(255);
  }
  const output = cmd.stdout.toString();
  logger.log(output);
  if (cmd.status !== 0) {
    logger.log(`Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`);
    logger.log(cmd.stderr.toString());
    process.exit(cmd.status);
  }
  return output;
};

// automatically catch peer dependency warnings and error out
const checkWarning = (command, args, options, dependency) => {
  options = {
    ...options,
    shell: true,
  };
  const cmd = exec(command, args, options);
  if (cmd.stderr.toString().match(`npm WARN ${dependency}`)) {
    logger.log(`Command ${command} failed with incompatible peer dependency for ${dependency}`);

    process.exit(255);
  }
  if (cmd.error) {
    logger.log(`Command ${command} failed with ${cmd.error.code}`);

    process.exit(255);
  }
  const output = cmd.stdout.toString();
  logger.log(output);
  if (cmd.status !== 0) {
    logger.log(`Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`);
    logger.log(cmd.stderr.toString());
    process.exit(cmd.status);
  }
  return output;
};

// Will prompt user for input before continue
// Exptected input 'yes' to continue
// Optinal callback(): instead of terminating process will run passed cb.
function shouldContinuePrompt(callback = null) {
  const answer = prompt(`Type '${util.format('\x1b[32m%s\x1b[0m', YES)}' to continue `);

  if (!answer || answer.trim().toLowerCase() !== YES) {
    logger.log('Exiting...');
    if (callback) {
      callback();
    } else {
      process.exit(1);
    }
  }
}

const packDependency = () => {
  spawnOrFail('npm', ['install']);
  spawnOrFail('npm', ['run build']);
  spawnOrFail('npm', ['pack']);
};

const updateDependency = (name, path) => {
  if (path) {
    logger.log(`Installing ${name} from local file`);
    spawnOrFail('npm', [`install ${path}`]);
  } else {
    logger.log(`Installing ${name} from npm`);
    spawnOrFail('npm', [`install ${name}`]);
  }
};

module.exports = {
  logger,
  spawnOrFail,
  process,
  shouldContinuePrompt,
  checkWarning,
  packDependency,
  updateDependency,
};
