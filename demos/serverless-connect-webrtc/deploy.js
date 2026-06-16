const { spawnSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

let region = 'us-east-1';
let bucket = '';
let stack = '';

function usage() {
  console.log(`Usage: node deploy.js [-r region] [-b bucket] [-s stack]`);
  console.log(`  -r, --region       Target region, default '${region}'`);
  console.log(`  -b, --s3-bucket    S3 bucket for deployment, required`);
  console.log(`  -s, --stack-name   CloudFormation stack name, required`);
  console.log(`  -h, --help         Show help and exit`);
}

function getArgOrExit(i, args) {
  if (i >= args.length) {
    console.log('Too few arguments');
    usage();
    process.exit(1);
  }
  return args[i];
}

function parseArgs() {
  const args = process.argv.slice(2);
  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '-h': case '--help':
        usage();
        process.exit(0);
        break;
      case '-r': case '--region':
        region = getArgOrExit(++i, args);
        break;
      case '-b': case '--s3-bucket':
        bucket = getArgOrExit(++i, args);
        break;
      case '-s': case '--stack-name':
        stack = getArgOrExit(++i, args);
        break;
      default:
        console.log(`Invalid argument ${args[i]}`);
        usage();
        process.exit(1);
    }
    ++i;
  }
  if (!stack.trim() || !bucket.trim()) {
    console.log('Missing required parameters');
    usage();
    process.exit(1);
  }
}

function spawnOrFail(command, args, options) {
  options = { ...options, shell: true };
  const cmd = spawnSync(command, args, options);
  if (cmd.error) {
    console.log(`Command ${command} failed with ${cmd.error.code}`);
    process.exit(255);
  }
  const output = cmd.stdout.toString();
  console.log(output);
  if (cmd.status !== 0) {
    console.log(`Command ${command} failed with exit code ${cmd.status}`);
    console.log(cmd.stderr.toString());
    process.exit(cmd.status);
  }
  return output;
}

function ensureBucket() {
  const s3Api = spawnSync('aws', ['s3api', 'head-bucket', '--bucket', bucket, '--region', region]);
  if (s3Api.status !== 0) {
    console.log(`Creating S3 bucket ${bucket}`);
    spawnOrFail('aws', ['s3', 'mb', `s3://${bucket}`, '--region', region]);
  }
}

parseArgs();
spawnOrFail('aws', ['--version']);
spawnOrFail('sam', ['--version']);

if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

console.log(`Using region ${region}, bucket ${bucket}, stack ${stack}`);
ensureBucket();

// Build the browser demo and copy the HTML
console.log('Building browser demo...');
spawnOrFail('npm', ['run', 'build:fast'], { cwd: path.join(__dirname, '..', 'browser'), env: { ...process.env, APP: 'connectWebRTC' } });
fs.copySync('../browser/dist/connectWebRTC.html', 'src/index.html');

// Install Lambda dependencies
spawnOrFail('npm', ['install'], { cwd: path.join(__dirname, 'src') });

// Package and deploy
spawnOrFail('sam', ['package', '--s3-bucket', bucket, '--output-template-file', 'build/packaged.yaml', '--region', region]);

console.log('Deploying serverless application...');
spawnOrFail('sam', ['deploy', '--template-file', './build/packaged.yaml', '--stack-name', stack,
  '--capabilities', 'CAPABILITY_IAM', '--region', region, '--no-fail-on-empty-changeset']);

console.log('Connect WebRTC Demo URL:');
spawnOrFail('aws', ['cloudformation', 'describe-stacks', '--stack-name', stack,
  '--query', 'Stacks[0].Outputs[0].OutputValue', '--output', 'text', '--region', region]);
