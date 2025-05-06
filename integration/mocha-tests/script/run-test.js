#!/usr/bin/env node

const { argv, kill, exit } = require('process');
const { runSync, runAsync } = require('../utils/HelperFunctions');
const args = require('minimist')(argv.slice(2));
const path = require('path');
const fs = require('fs');
const { Logger, LogLevel, Log } = require('../utils/Logger');
const crypto = require('crypto');

const pathToIntegrationFolder = path.resolve(__dirname, '../tests');
const pathToTestDemoFolder = path.resolve(__dirname, '../../../demos/browser');
const pathToConfigsFolder = path.resolve(__dirname, '../configs');

let testName = '';
let testImplementation = '';
let testType = 'integration-test';
let testConfig = '';
let logger;

const setupLogger = () => {
  logger = new Logger('Test Runner (run-test)');
  logger.log('Logger setup finished');
}

const usage = () => {
  console.log(`Usage: run-test -- [-t test] [-h host] [-y test-type] [-c config]`);
  console.log(`  --test-name               Target test name [Required]`);
  console.log(`  --host                    WebDriver server [Required] [default: local]`);
  console.log(`  --test-type               Test type [Required] [default: integration-test]`);
  console.log(`  --test-implementation     Name of mocha test file stored in the tests folder [Optional]`);
  console.log(`  --config                  Name of custom config stored in configs folder [Optional]`);
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
  console.log(`  --test-implementation`);
  console.log(`    By default, the test name will be used for test implementation file`);
  console.log(`    JS extension will be automatically appended to the test name`);
  console.log(`    If the test file has a different name then a file name can be passed`);
  console.log(`      DifferentAudioTest.js: Name of test file\n`);
  console.log(`  --config`);
  console.log(`  Custom config is passed when a test is incompatible with one of the browser / OS combination provided by default`)
  console.log(`    sample_test.config.json: Name of custom config stored in configs folder`);
};

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

      case 'test-implementation':
        testImplementation = value.concat('.js');
        break;

      case 'config':
        testConfig = value;
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

const checkIfPortIsInUse = async port =>
  new Promise(resolve => {
    const server = require('http')
      .createServer()
      .listen(port, 'localhost', () => {
        server.close();
        resolve(false);
      })
      .on('error', () => {
        resolve(true);
      });
  });

function startTestDemo() {
  if(process.env.HOST !== 'local')  {
    logger.log('Local demo will be started only for local tests');
    logger.log('For SauceLabs or DeviceFarm test, please pass TEST_URL env variable');
    return;
  }

  logger.log('Installing dependencies in test demo');
  runSync('npm', ['install'], { cwd: pathToTestDemoFolder });

  logger.log('Starting the test demo');
  // The test demo will keep running until the process is terminated,
  // so we should execute this command asynchronously without blocking other commands.
  runAsync('npm', ['run', 'start'], { cwd: pathToTestDemoFolder });
}

const waitUntilTestDemoStarts = async () => {
  if(process.env.HOST !== 'local')  {
    return;
  }

  logger.log('Waiting for test demo to start');
  count = 0;
  threshold = 60;

  while (count < 60) {
    const isInUse = await checkIfPortIsInUse(8080);
    if (isInUse === true) {
      logger.log('Test demo has started successfully');
      return;
    }
    count += 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  logger.log('Test demo did not start successfully', LogLevel.ERROR);
  terminateTestDemo(pid);
  exit(1);
};

const startTesting = async (testSuite, testType) => {
  logger.log('Running test');
  const test = {
    name: testName,
    testImpl: testImplementation
  };
  let clients;

  if(testType === 'browser-compatibility')  {
    logger.log('Setting clients for browser compatibility tests');

    if(testConfig.length === 0)  {
      logger.log('Using default browser compatibility config');
      clients = [
        {
          "browserName": "chrome",
          "browserVersion": "latest-2",
          "platform": "MAC"
        },
        {
          "browserName": "chrome",
          "browserVersion": "latest-1",
          "platform": "MAC"
        },
        {
          "browserName": "chrome",
          "browserVersion": "latest",
          "platform": "MAC"
        },
        {
          "browserName": "chrome",
          "browserVersion": "latest-2",
          "platform": "WINDOWS"
        },
        {
          "browserName": "chrome",
          "browserVersion": "latest-1",
          "platform": "WINDOWS"
        },
        {
          "browserName": "chrome",
          "browserVersion": "latest",
          "platform": "WINDOWS"
        },
        {
          "browserName": "firefox",
          "browserVersion": "latest-2",
          "platform": "MAC"
        },
        {
          "browserName": "firefox",
          "browserVersion": "latest-1",
          "platform": "MAC"
        },
        {
          "browserName": "firefox",
          "browserVersion": "latest",
          "platform": "MAC"
        },
        {
          "browserName": "firefox",
          "browserVersion": "latest-2",
          "platform": "WINDOWS"
        },
        {
          "browserName": "firefox",
          "browserVersion": "latest-1",
          "platform": "WINDOWS"
        },
        {
          "browserName": "firefox",
          "browserVersion": "latest",
          "platform": "WINDOWS"
        },
        {
          "browserName": "safari",
          "browserVersion": "latest",
          "platform": "MAC"
        }
      ];
    }
    else  {
      logger.log('Using custom browser compatibility config');
      let testConfigRaw = fs.readFileSync(path.resolve(pathToConfigsFolder, testConfig));
      let testConfigJSON = JSON.parse(testConfigRaw);
      clients = testConfigJSON.clients;
    }
  }
  else  {
    logger.log('Setting clients for integration tests');
    clients = [
      {
        browserName: "chrome",
        browserVersion: "latest",
        platform: "MAC"
      }
    ];
  }

  await runTest(test, clients);
};

const runTest = async (test, clients) => {
  process.env.FORCE_COLOR = '1';
  process.env.JOB_ID = crypto.randomUUID();
  process.env.TEST = JSON.stringify(test);
  
  const maxRetries = test.retry === undefined || test.retry < 1 ? 5 : test.retry;
  let retryCount = 0;
  let testResult;
  let testSuiteResult = 0;

  for(let idx = 0; idx < clients.length; idx++)  {
    if(retryCount > 0)  {
      logger.log(`------------------ RETRY ATTEMPT ${retryCount} ------------------`, LogLevel.WARN);
    }

    let client = clients[idx];
    process.env.CLIENT = JSON.stringify(client);
    logger.log(`Running ${test.name} on \n    browser name = ${client.browserName}, \n    version = ${client.browserVersion}, and \n    platform = ${client.platform}`);

    try {
      testResult = await runAsync('mocha', [test.testImpl], { cwd: pathToIntegrationFolder, timeout: 300000, color: true, bail: true });
    }
    catch (error) {
      logger.log(`Mocha run command failed, failure status code: ${error}`, LogLevel.ERROR);
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
}

const terminateTestDemo = () => {
  if(process.env.HOST != 'local') {
    return;
  }
  logger.log('Terminating the test demo');

  const demoPid = runSync('lsof', ['-i', ':8080', '-t'], null, printOutput = false);
  if (demoPid) kill(demoPid, 'SIGKILL');
};

(async () => {
  setupLogger();
  const { testSuite, testType } = parseArgs();
  startTestDemo();
  await waitUntilTestDemoStarts();
  await startTesting(testSuite, testType);
  terminateTestDemo();
})();
