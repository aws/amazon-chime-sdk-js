#!/usr/bin/env node

/**
 * Test Runner Script for Amazon Chime SDK JS Integration Tests
 * 
 * This script is responsible for running integration and browser compatibility tests
 * for the Amazon Chime SDK JS library. It handles:
 * - Parsing command line arguments
 * - Setting up the test environment
 * - Starting the test demo server
 * - Running tests against different browser/OS combinations
 * - Handling test retries
 * - Cleaning up resources after tests complete
 */

const { argv, kill, exit } = require('process');
const { runSync, runAsync } = require('../utils/HelperFunctions');
const args = require('minimist')(argv.slice(2));
const path = require('path');
const fs = require('fs');
const { Logger, LogLevel, Log } = require('../utils/Logger');
const browserCompatibilityConfig = require('../configs/BrowserCompatibilityBrowserConfig');
const integrationTestBrowserConfig = require('../configs/IntegrationTestBrowserConfig');

const pathToIntegrationFolder = path.resolve(__dirname, '../tests');
const pathToTestDemoFolder = path.resolve(__dirname, '../../../demos/browser');
const pathToConfigsFolder = path.resolve(__dirname, '../configs');

// Global variables to store test configuration
let testName = '';            // Name of the test to run
let testImplementation = '';  // Name of the test implementation file
let testType = 'integration-test'; // Type of test to run (integration-test or browser-compatibility)
let testConfig = '';          // Custom test configuration file
let retry = undefined;        // Number of retries for failed tests
let sessions = undefined;     // Number of browser sessions to use
let logger;                   // Logger instance


const setupLogger = () => {
  logger = new Logger('Test Runner (run-test)');
  logger.log('Logger setup finished');
}

const usage = () => {
  console.log(`Usage: run-test -- [-t test] [-h host] [-y test-type] [-c config]`);
  console.log(`  --test-name               Target test name [Required]`);
  console.log(`  --host                    WebDriver server [Required] [default: local]`);
  console.log(`  --test-type               Test type [Required] [default: integration-test]`);
  console.log(`  --retry                   Number of retry [Optional] [default: 5]`);
  console.log(`  --sessions                Number of browser sessions to use [Optional] [default: auto]`);
  console.log(`  --test-implementation     Name of mocha test file stored in the tests folder [Optional]`);
  console.log(`  --config                  Name of custom config stored in configs folder [Optional]`);
  console.log(`  --headless                Run tests in headless mode [Optional] [default: false]`);
  console.log(`Values:`);
  console.log(`  --test-name`);
  console.log(`    AudioTest: Test name\n`);
  console.log(`  --host`);
  console.log(`    local: Run tests locally`);
  console.log(`    saucelabs: Run tests on SauceLabs`);
  console.log(`    devicefarm: Run tests on DeviceFarm\n`);
  console.log(`  --test-type`);
  console.log(`    integration-test: Run integration test`);
  console.log(`    browser-compatibility: Run browser compatibility test\n`);
  console.log(`  --sessions`);
  console.log(`    1: Use a single browser session with multiple tabs`);
  console.log(`    2: Use two separate browser sessions\n`);
  console.log(`  --test-implementation`);
  console.log(`    By default, the test name will be used for test implementation file`);
  console.log(`    JS extension will be automatically appended to the test name`);
  console.log(`    If the test file has a different name then a file name can be passed`);
  console.log(`      DifferentAudioTest.js: Name of test file\n`);
  console.log(`  --config`);
  console.log(`  Custom config is passed when a test is incompatible with one of the browser / OS combination provided by default`)
  console.log(`  --headless`);
  console.log(`    true: Run browser in headless mode (useful for CI environments)`);
  console.log(`    false: Run browser in normal mode with visible UI (default)`);
};

/**
 * Parses command line arguments and sets up the test environment accordingly
 * Validates arguments and sets environment variables based on the provided options
 * @returns {Object} Object containing test suite and test type information
 */
const parseArgs = () => {
  for (const [key, value] of Object.entries(args)) {
    if (key === '_') continue;
    switch (key) {
      case 'help':
        usage();
        exit(0);

      case 'test-name':
        testName = value;
        break;

      case 'host':
        process.env.HOST = value.toLowerCase();
        break;

      case 'test-type':
        process.env.TEST_TYPE = value.toLowerCase();
        testType = value.toLowerCase();
        break;

      case 'retry':
        retry = parseInt(value, 10);
        break;

      case 'sessions':
        sessions = parseInt(value, 10);
        if (sessions !== 1 && sessions !== 2) {
          logger.log(`Invalid sessions value: ${sessions}. Must be 1 or 2. Using default.`, LogLevel.WARN);
          sessions = undefined;
        } else {
          process.env.NUMBER_OF_SESSIONS = sessions;
          logger.log(`Setting number of sessions to ${sessions}`, LogLevel.INFO);
        }
        break;

      case 'test-implementation':
        testImplementation = value.concat('.js');
        break;

      case 'config':
        testConfig = value;
        break;
        
      case 'headless':
        const headless = value === 'true' || value === true;
        process.env.HEADLESS_MODE = headless;
        logger.log(`Setting headless mode to ${headless}`, LogLevel.INFO);
        break;

      default:
        logger.log(`Invalid argument ${key}`, LogLevel.ERROR);
        usage();
        exit(1);
    }
  }

  if(!testImplementation) {
    logger.log('Using test name as the name for the test implementation file as per default settings', LogLevel.WARN);
    testImplementation = testName.concat('.js');
  }

  return {
    testSuite: testName,
    testType
  };
};

/**
 * Checks if a specific port is in use
 * Used to determine if the test demo server is running
 * @param {number} port - The port number to check
 * @returns {Promise<boolean>} True if the port is in use, false otherwise
 */
const checkIfPortIsInUse = async port => {
  try {
    // Try to make a request to the server to check if it's responding
    const http = require('http');
    return new Promise(resolve => {
      const req = http.get(`http://localhost:${port}`, res => {
        // If we get any response, the server is up
        resolve(true);
        req.destroy();
      });
      
      req.on('error', () => {
        // If there's an error, the server might not be ready yet
        resolve(false);
      });
      
      // Set a timeout for the request
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch (error) {
    logger.log(`Error checking if port ${port} is in use: ${error}`, LogLevel.ERROR);
    return false;
  }
};

/**
 * Starts the test demo server
 * If TEST_URL is defined, skips starting the local server and uses the provided URL
 * Otherwise, installs dependencies and starts the demo server locally
 */
function startTestDemo() {
  // If TEST_URL is defined, use it and don't start the demo
  if (process.env.TEST_URL) {
    logger.log(`Using provided TEST_URL: ${process.env.TEST_URL}`, LogLevel.INFO);
    return;
  }

  // Otherwise, start the test demo
  logger.log('TEST_URL not defined, starting local test demo');
  logger.log('Installing dependencies in test demo');
  runSync('npm', ['install'], { cwd: pathToTestDemoFolder });

  logger.log('Starting the test demo');
  // The test demo will keep running until the process is terminated,
  // so we should execute this command asynchronously without blocking other commands.
  runAsync('npm', ['run', 'start'], { cwd: pathToTestDemoFolder })
    .catch(error => {
      // Check if this is a termination signal (code 143 = 128 + SIGTERM(15))
      if (error.message && error.message.includes('exit code 143')) {
        logger.log('Test demo was terminated as part of cleanup - this is expected', LogLevel.INFO);
      }
    });
}

/**
 * Waits until the test demo server is fully started and ready to accept connections
 * Polls the server port until it responds or times out
 * @returns {Promise<void>}
 */
const waitUntilTestDemoStarts = async () => {
  // Skip if TEST_URL is defined
  if (process.env.TEST_URL) {
    return;
  }

  logger.log('Waiting for test demo to start');
  let count = 0;
  const threshold = 60;

  while (count < threshold) {
    const isInUse = await checkIfPortIsInUse(8080);
    if (isInUse === true) {
      // Give the server a moment to fully initialize after the port is bound
      await new Promise((resolve) => setTimeout(resolve, 2000));
      logger.log('Test demo has started successfully');
      return;
    }
    count += 1;
    logger.log(`Waiting for demo to start... (${count}/${threshold})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  logger.log('Test demo did not start successfully', LogLevel.ERROR);
  terminateTestDemo();
  exit(1);
};

/**
 * Starts the testing process
 * Sets up test configuration and client configurations based on test type
 * @param {string} testSuite - The test suite to run
 * @param {string} testType - The type of test to run (integration-test or browser-compatibility)
 * @returns {Promise<void>}
 */
const startTesting = async (testSuite, testType) => {
  logger.log('Running test');
  const test = {
    name: testName,
    testImpl: testImplementation,
    retry: retry
  };
  let clients;

  if(testType === 'browser-compatibility')  {
    logger.log('Setting clients for browser compatibility tests');

    if(testConfig.length === 0)  {
      logger.log('Using default browser compatibility config');
      clients = browserCompatibilityConfig;
    } else  {
      logger.log('Using custom browser compatibility config');
      let testConfigRaw = fs.readFileSync(path.resolve(pathToConfigsFolder, testConfig));
      let testConfigJSON = JSON.parse(testConfigRaw);
      clients = testConfigJSON.clients;
    }
  } else  {
    logger.log('Setting clients for integration tests');
    clients = integrationTestBrowserConfig;
  }

  await runTest(test, clients);
};

/**
 * Runs tests against specified clients (browser/OS combinations)
 * Handles test retries if tests fail
 * @param {Object} test - Test configuration object
 * @param {Array<Object>} clients - Array of client configurations to test against
 * @returns {Promise<number>} Test result code (0 for success, 1 for failure)
 */
const runTest = async (test, clients) => {
  process.env.FORCE_COLOR = '1';
  process.env.TEST = JSON.stringify(test);

  const maxRetries = test.retry === undefined ? 5 : test.retry;
  let retryCount = 0;
  let testResult;
  let testSuiteResult = 0;

  for(let idx = 0; idx < clients.length; idx++)  {
    if(retryCount > 0)  {
      logger.log(`------------------ RETRY ATTEMPT ${retryCount} ------------------`, LogLevel.WARN);
    }

    let client = clients[idx];
    process.env.CLIENT = JSON.stringify(client);
    process.env.BROWSER_NAME = client.browserName;
    logger.log(`Starting ${test.name} on browser name = ${client.browserName}, version = ${client.browserVersion}, and platform = ${client.platform}`);

    try {
      testResult = await runAsync('mocha', [test.testImpl], { cwd: pathToIntegrationFolder, timeout: 300000, color: true, bail: true });
    }
    catch (error) {
      logger.log(`Mocha run command failed: ${error.message || error}`, LogLevel.ERROR);
      testResult = 1;
    }

    if (testResult === 1) {
      logger.log(`${test.name} failed on ${client.browserName}, ${client.browserVersion} on ${client.platform}`, LogLevel.ERROR);

      if(retryCount < maxRetries)  {
        logger.log(`${test.name} will rerun the test on the same browser and OS combination`, LogLevel.WARN);
        logger.log(`Retrying ${test.name} on ${client.browserName}, ${client.browserVersion}, and ${client.platform} OS`);
        idx--;
        retryCount++;
        continue;
      }
      if(retryCount === maxRetries) {
        logger.log(`Test has retried on the same client ${retryCount} times`, LogLevel.WARN);
        logger.log(`Setting test suite result to 1`, LogLevel.ERROR);
        logger.log('Test will continue to run on other browser and OS combinations');
        testSuiteResult = 1;
        break;
      }
    }
  }

  // TODO: Any Cloudwatch metrics can be sent at this point, if the test fails after retrying 4 times than it should be logged as a failure.
  // If a failure occurs and the consecutive retry runs successfully then only a success data point will be recorded.
  if (testSuiteResult === 1) {
    logger.log(`${test.name} suite failed :(`, LogLevel.ERROR);
  }
  if (testSuiteResult === 0)  {
    logger.log(`${test.name} suite ran successfully :)`, LogLevel.SUCCESS);
  }

  logger.log('Test run completed');
  return testSuiteResult;
}

/**
 * Terminates the test demo server
 * Finds the process running on port 8080 and sends termination signals
 * Attempts graceful termination first (SIGTERM) before using SIGKILL if necessary
 * @returns {Promise<void>}
 */
const terminateTestDemo = async () => {
  // Skip if TEST_URL is defined
  if (process.env.TEST_URL) {
    return;
  }
  
  logger.log('Terminating the test demo');

  try {
    const demoPid = runSync('lsof', ['-i', ':8080', '-t'], { stdio: 'pipe' }, false).trim();
    if (demoPid) {
      logger.log(`Killing process with PID: ${demoPid}`);
      // Use a more graceful termination signal first
      kill(demoPid, 'SIGTERM');

      // Give the process some time to terminate gracefully
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if the process is still running
      try {
        const stillRunning = runSync('ps', ['-p', demoPid], { stdio: 'pipe' }, false).trim();
        if (stillRunning && stillRunning.includes(demoPid)) {
          logger.log('Process did not terminate gracefully, using SIGKILL', LogLevel.WARN);
          kill(demoPid, 'SIGKILL');
        }
      } catch (checkError) {
        // Process is likely already gone, which is fine
        logger.log('Process already terminated');
      }
    } else {
      logger.log('No process found running on port 8080');
    }
  } catch (error) {
    logger.log(`Error terminating test demo: ${error}`, LogLevel.ERROR);
  }
};

/**
 * Main execution function
 * Orchestrates the entire test process:
 * 1. Sets up the logger
 * 2. Parses command line arguments
 * 3. Starts the test demo server
 * 4. Waits for the server to start
 * 5. Runs the tests
 * 6. Cleans up resources
 */
(async () => {
  try {
    setupLogger();
    const { testSuite, testType } = parseArgs();

    startTestDemo();

    try {
      await waitUntilTestDemoStarts();
      await startTesting(testSuite, testType);
    } finally {
      try {
        await terminateTestDemo();
      } catch (cleanupError) {
        logger.log(`Error during cleanup: ${cleanupError.message || cleanupError}`, LogLevel.ERROR);
      }
    }
  } catch (error) {
    logger.log(`Test execution failed: ${error.message || error}`, LogLevel.ERROR);
    process.exit(1);
  }
})().catch(error => {
  console.error(`Unhandled error in main execution: ${error.message || error}`);
  process.exit(1);
});
