#!/usr/bin/env node

const fs = require('fs');
const exec = require('child_process').spawnSync;
const process = require('process');
const path = require('path');
const input = require('process').stdin;
const output = require('process').stdout;
const util = require('util');
const readline = require('readline');

const YES = 'yes';

const logger = {
  error: (output, info = '') => console.error('\x1b[31m%s\x1b[0m', output, info), // Red
  log: output => console.log('\x1b[36m%s\x1b[0m', output), // Teal
  warn: output => console.warn('\x1b[33m%s\x1b[0m', output), // Yellow
};

const spawnOrFail = (command, args, options) => {
  const cmd = exec(command, args, { shell: true });
  if (cmd.error) {
    logger.log(`Command ${command} failed with ${cmd.error.code}`);
    quit(255);
  }
  const output = cmd.stdout.toString();
  if (!options || !options.skipOutput) {
    logger.log(output);
  }
  if (cmd.status !== 0) {
    logger.error(`Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`);
    logger.error(cmd.stderr.toString());
    quit(cmd.status);
  } else if (options && options.printErr) { // Some commands like npm pack output to stderr
    logger.log(cmd.stderr.toString());
  }
  return output;
};

const prompt = async (prompt) => {
  return new Promise((resolve) => {
    rl = readline.createInterface({ input , output });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer)
    });
  });
};

const shouldContinuePrompt = async () => {
  const cont = await new Promise((resolve) => {
    rl = readline.createInterface({ input , output });
    rl.question(`Type '${util.format('\x1b[32m%s\x1b[0m', YES)}' to continue\n`, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === YES);
    });
  });
  if (!cont) {
    quit(0);
  }
};

const quit = (statusCode) => {
  process.exit(statusCode);
};

module.exports = {
  logger,
  spawnOrFail,
  prompt,
  shouldContinuePrompt,
  quit,
  fs,
  process,
  path
};
