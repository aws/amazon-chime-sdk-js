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

  // Collect stderr output instead of immediately rejecting
  let stderrOutput = '';
  child.stderr.on('data', (error) => {
    process.stdout.write(error);
    stderrOutput += error;
  });

  const promise = new Promise((resolve, reject) => {
    child.on('close', (code) => {
      console.log(`Command ${command} closed all stdio streams with status code: ${code}`);
    });

    child.on('exit', (code) => {
      console.log(`Command ${command} exited with status code: ${code}`);
      if(code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command ${command} failed with exit code ${code}`));
      }
    });

    // Add error event handler for process spawn errors
    child.on('error', (err) => {
      console.error(`Failed to start command ${command}: ${err.message}`);
      reject(err);
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
  } else if (child.status !== 0) {
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