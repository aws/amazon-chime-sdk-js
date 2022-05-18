# Mocha Tests

The Amazon Chime SDK team is transitioning integration tests from KITE to Mocha. Starting with audio tests, we will transition all the integration tests. The `integration/mocha-tests` directory contains the mocha version of integration tests.

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

Sample command to run an integration test locally:

```bash
npm run test -- --test-name AudioTest --host local --test-type integration-test
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

Sauce Labs will open a browser and load a test url. The following command requires the [Chime SDK serverless demo](https://github.com/aws/amazon-chime-sdk-js/tree/main/demos/serverless) deployed in your AWS account. If you haven’t already, follow the [Chime SDK serverless demo instruction](https://github.com/aws/amazon-chime-sdk-js/tree/main/demos/serverless) to deploy the demo. You can set the demo url as an environment variable with the following command:
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
