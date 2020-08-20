#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const readline = require('readline');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');

process.cwd(path.join(__dirname, '..'));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the NPM auth token: ', function(token) {
  fs.writeFileSync('.npmrc', `//registry.npmjs.org/:_authToken=${token}`);
  rl.close();
});

rl.on('close', function() {
  exec('npm whoami', (err, stdout, _) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log(`Logged in as: ${stdout.trim()}`);
      process.exit(0);
    }
  });
});
