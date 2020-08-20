#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');

process.cwd(path.join(__dirname, '..'));

exec('npm logout', (err, _stdout, _stderr) => {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.log('Logged out (auth token deleted)');
    fs.unlinkSync('.npmrc');
    process.exit(0);
  }
});
