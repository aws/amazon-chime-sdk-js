# Mocha Tests

This directory contains the Mocha-based integration tests for the Amazon Chime SDK for JavaScript.

## Test Types
There are two types of Mocha tests: integration and browser compatibility.

### Integration Tests
Integration tests are minimal tests that run on the latest Chrome on macOS. These tests are used to test the basic functionality across the more popular browsers.

### Browser Compatibility Tests
Using browser compatibility tests, we ensure that the Chime SDK for JavaScript features are compatible in all our [supported browsers](https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-browsers). Browser compatibility tests include the default set of browsers and OSs. You can also add new browsers to the custom configuration.

In the following section, we will go over the schema of the custom JSON config.
#### JSON Config Schema

```json
{
   "clients": [
     {
        "browserName": "chrome",
        "browserVersion": "latest",
        "platform": "MAC"
     }
   ]
}
```
## Running Tests

### Running Integration Test Locally
You can run the integration tests locally. By default, integration tests will run on the latest version of Chrome installed on your machine.
You will have to make sure that you have the required drivers installed on your machine that the selenium test uses. You can find more information about the different drivers available at the `selenium-webdriver` npm page: [https://www.npmjs.com/package/selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver). 

If you have an older version of driver installed, then you will need to have an older version of browser on your machine as well. Generally, it is recommended to do local testing on the latest version. If you need to test on an older version, you can run a browser compatibility test with Sauce Labs.

#### Installing necessary drivers
To install drivers for Chrome, Firefox, and Safari that matches your Chrome version, you can use the provided script:

```bash
# Automatically detect Chrome version and install matching ChromeDriver
./script/install_mac.sh
```
Note that if your tests need two instances then Safari does not support it and you may need to use remote providers like SauceLabs

Sample command to run an integration test locally:

```bash
npm run test -- --test-name AudioTest --host local --test-type integration-test
```

To limit the number of retries for failed tests, use the `--retry` parameter:

```bash
npm run test -- --test-name AudioTest --host local --test-type integration-test --retry 0
```

To specify the number of browser sessions to use, use the `--sessions` parameter:

```bash
# Use a single browser session with multiple tabs (default)
npm run test -- --test-name AudioTest --host local --test-type integration-test --sessions 1

# Use two separate browser sessions
npm run test -- --test-name AudioTest --host local --test-type integration-test --sessions 2
```

Browser compatiblity tests will run across a variety of browser and OS combinations so it is recommended to use Sauce Labs for them.

### Running Browser Compatibility Tests on Sauce Labs
To run the test on Sauce Labs, the username and access key will be required for authentication. Update the following commands with the credentials and add the credentials to environment variables.
```bash
export SAUCE_USERNAME=<Sauce Labs account username>
```
```bash
export SAUCE_ACCESS_KEY=<Sauce Labs access key>
```

Sauce Labs will open a browser and load a test url. The following command requires the [Chime SDK serverless demo](https://github.com/aws/amazon-chime-sdk-js/tree/main/demos/serverless) deployed in your AWS account. If you haven't already, follow the [Chime SDK serverless demo instruction](https://github.com/aws/amazon-chime-sdk-js/tree/main/demos/serverless) to deploy the demo. You can set the demo url as an environment variable with the following command:
```bash
export TEST_URL=<Chime SDK for JavaScript serverelss demo URL>
```

The following command can be used to run browser compatibility tests with default settings on Sauce Labs:

```bash
npm run test -- --test-name AudioTest --host saucelabs --test-type browser-compatibility
```

There are scenarios where a test might not be compatible with one of the browsers or OS. In that case, the user can provide a custom config with an updated clients array. `sample_test.config.json` is a sample test config already provided. 
The following command can be used to run a browser compatibility test with a custom config:

```bash
npm run test -- --test-name AudioTest --host saucelabs --test-type browser-compatibility --config browserCompatibilityTest/desktop/sample_test.config.json
```

### Running Browser Compatibility Tests on AWS Device Farm
To run the tests on Device Farm, you will need an AWS account. Once you have an AWS account, you will need to set up two environment variables that will allow the AWS SDK to authenticate to your AWS account.
```bash
export AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
```

You will need to create a Device Farm project in the AWS account that you are planning to use. There are two types of Device Farm projects that can be created: `Mobile Device Testing` and `Desktop Browser Testing`. For this section, we will focus mainly on desktop browser testing.
After the project is created, you will need to set up a `PROJECT_ARN` as an environment variable. The project ARN is used by the Device Farm API to identify the project to create test sessions inside.
```bash
export PROJECT_ARN=<YOUR_PROJECT_ARN>
```

The following command can be used to run a browser compatibility test with default settings on Device Farm:
```bash
npm run test -- --test-name AudioTest --host devicefarm --test-type browser-compatibility
```

Like Sauce Labs, Device Farm can run browser compatibility tests with a custom config:
```bash
npm run test -- --test-name AudioTest --host devicefarm --test-type browser-compatibility --config browserCompatibilityTest/desktop/sample_test.config.json
```

## Test Structure

### Using the TestSetup Helper
The `steps/TestSetup.js` module provides reusable test setup and teardown functionality. This helps maintain consistency across tests and reduces code duplication.

Example usage:
```javascript
const setupTestEnvironment = require('../steps/TestSetup');

describe('MyTest', async function () {
  // Get the test setup functions
  const testSetup = setupTestEnvironment('MyTest');
  
  describe('run test', async function () {
    // Setup the base test environment
    testSetup.setupBaseTest();
    
    // Your test code here
  });
});
```

### Session Management
Tests can run in one of two session modes:

1. **Single Session Mode (default)**: Uses one browser instance with multiple tabs
2. **Multi-Session Mode**: Uses two separate browser instances

The session mode is determined by:
1. Command line parameter `--sessions` (1 or 2)
2. Automatic detection based on browser/platform (Safari and mobile platforms use 2 sessions by default)

To handle both session modes in your test, use code like this:

```javascript
if (this.numberOfSessions === 1) {
  // Single session: use two tabs
  test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
  monitor_window = await Window.openNew(this.driverFactoryOne.driver, this.logger, 'MONITOR');
} else {
  // Multiple sessions: use separate browsers
  test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
  monitor_window = await Window.existing(this.driverFactoryTwo.driver, this.logger, 'MONITOR');
}
```

## Logging
This section will go over the two distinct ways of logging:
1. Use `logger.log` for inline logging
2. Use `logger.pushLogs` for buffered logging

You can use `logger.log` as a default logger with enhanced functionalities. `logger.log` supports two additional features:
- `logger.log` takes one of the four log levels: `LogLevel.INFO`, `LogLevel.WARN`, `LogLevel.ERROR`, and `LogLevel.SUCCESS`.
- `logger.log` outputs messages to the console in different colors based on the log level.

Integration tests use `mocha` as their test framework. Mocha prints the test results and some limited logs to the console automatically. Any console logs inside `it` will print before the mocha logs.
This makes debugging hard as the logs seem out of sync and random. To get around this issue, buffered logging was added. Inside of `it` blocks, `logger.pushLogs` can be used to add logs to the buffer and a call to `logger.printLogs` inside of the `afterEach` hook will print the logs in the desired order.
```ts
afterEach(async function () {
  this.logger.printLogs();
});
``` 

Mocha provides hooks like `before`, `after`, `beforeEach`, `afterEach` to perform actions at a specific time of the testing cycle. Any logs printed inside the hooks will print in line, so inline logging can be used and there is no need for buffered logging.
