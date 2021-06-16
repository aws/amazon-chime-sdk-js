/*
 * This script exists because npm 7 (a) no longer supports npm_config_* (see
 * NPM RFC 21), and (b) turns invocations like `npm run build --app=foo` into
 * calls like `tsc && webpack foo`, which is totally busted.
 */

const spawn = require('cross-spawn');

const argv = process.argv;

console.info('ARGV:', argv);

const command = 'webpack';
const args = ['--config', './webpack.config.js'];
const options = {
  env: {
    ...process.env,
  },
};

const serve = argv.indexOf('--serve') !== -1;

console.info('Should start local server:', serve);

// This won't be present with npm 6.
// Exclude file paths.
const remainingArgs = argv.filter(v => v !== '--serve');
const lastIndex = remainingArgs.length - 1;
let possibleApp;
if (lastIndex >= 2) {
  possibleApp = remainingArgs[lastIndex];
  if (!possibleApp.startsWith('/')) {
    if (possibleApp.startsWith('app=')) {
      possibleApp = possibleApp.substring(4);
    }
    options.env.npm_config_app = possibleApp;
  }
}

console.info('Possible app:', possibleApp);

const webpack = spawn(command, args, options);

webpack.stdout.on('data', (data) => console.log(data.toString()));
webpack.stderr.on('data', (data) => console.error(data.toString()));
webpack.on('close', (status) => {
  console.info('Webpack existed with status', status);

  if (serve) {
    console.info('Starting server.');
    if (possibleApp) {
      process.env.npm_config_app = possibleApp;
    }
    require('../serve.js');
  } else {
    process.exit(status);
  }
});
