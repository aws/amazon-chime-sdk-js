#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');

// Run the command asynchronously without blocking the Node.js event loop.
function runAsync(command, args, options) {
  options = {
    ...options,
    shell: true
  };
  const child = spawn(command, args, options);

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    process.stdout.write(data + "\r");
  });

  const promise = new Promise((resolve, reject) => {
    child.on('close', (code) => {
      console.log(`Command ${command} closed all stdio streams with status code: ${code}`);
    });

    child.stderr.on('data', (error) => {
      process.stdout.write(error);
      reject(error);
    });

    child.on('exit', (code) => {
      console.log(`Command ${command} exited with status code: ${code}`);
      if(code === 0)  {
        resolve(code);
      }
      else if(code === 1) {
        reject(code);
      }
      else  {
        console.log(`Command ${command} exited with an unknown status code`);
        reject(code);
      }
    });
  });

  return promise;
}

// Run the command synchronously with blocking the Node.js event loop
// until the spawned process either exits or is terminated.
function runSync(command, args, options, printOutput = true) {
  options = {
    ...options,
    shell: true
  };
  const child = spawnSync(command, args, options);

  const output = child.stdout.toString();
  if (printOutput) {
    process.stdout.write(output);
  }

  if (child.error) {
    process.stdout.write(`Command ${command} failed with ${child.error.code}`);
  }

  if (child.status !== 0) {
    process.stdout.write(`Command ${command} failed with exit code ${child.status} and signal ${child.signal}`);
    process.stdout.write(child.stderr.toString());
  }

  return output;
}

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

module.exports = {
  runAsync,
  runSync,
  sleep
}