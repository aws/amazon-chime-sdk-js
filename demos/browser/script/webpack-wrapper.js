/*
 * This script exists because npm 7 (a) no longer supports npm_config_* (see
 * NPM RFC 21), and (b) turns invocations like `npm run build --app=foo` into
 * calls like `tsc && webpack foo`, which is totally busted.
 */

const { spawn } = require('child_process');

const argv = process.argv;

console.info('ARGV:', argv);

const command = 'webpack';
const args = ['--config', './webpack.config.js'];
const options = {
  env: {
    ...process.env,
  },
};

// This won't be present with npm 6.
// Exclude file paths.
const lastIndex = argv.length - 1;
if (lastIndex >= 2) {
  let possibleApp = argv[lastIndex];
  if (!possibleApp.startsWith('/')) {
    if (possibleApp.startsWith('app=')) {
      possibleApp = possibleApp.substring(4);
    }
    options.env.npm_config_app = possibleApp;
  }
}

const webpack = spawn(command, args, options);

webpack.stdout.on('data', (data) => console.log(data.toString()));
webpack.stderr.on('data', (data) => console.error(data.toString()));
webpack.on('close', (status) => {
  console.info('Webpack existed with status', status);
  process.exit(status);
});
