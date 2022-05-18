const { Builder } = require('selenium-webdriver');
const { Logger, LogLevel, Log } = require('./Logger');
const config = require('../configs/BaseConfig');
var AWS = require('aws-sdk');

class WebDriverFactory {
  constructor(testName, host, testType, url, logger) {
    this.testName = testName;
    this.host = host;
    if (this.host === 'devicefarm') {
      this.devicefarm = new AWS.DeviceFarm({ region: 'us-west-2' });
    }
    this.testType = testType;
    this.url = url;
    if (!!logger) {
      this.logger = logger;
    } else {
      this.logger = new Logger('WebDriverFactory');
    }
    this.numberOfSessions = 1;
    this.sauceLabsUrl = `https://${process.env.SAUCE_USERNAME}:${process.env.SAUCE_ACCESS_KEY}@ondemand.saucelabs.com/wd/hub`;
  }

  async configure() {
    let builder = new Builder();
    let client;
    let capabilities = {};

    switch (this.host) {
      case 'local':
        this.logger.log('No host configuration is required for local tests');
        this.logger.log(
          'Make sure the required selenium webdrivers are installed on the host machine',
          LogLevel.WARN
        );
        break;

      case 'saucelabs':
        this.logger.log('Configuring the webdriver for SauceLabs');
        builder.usingServer(this.sauceLabsUrl);

        if (process.env.BROWSER_VERSION) {
          this.logger.log('Using browser version stored as an environment variable');
          config.sauceOptions.browserVersion = process.env.BROWSER_VERSION;
        }
        if (process.env.PLATFORM_NAME) {
          this.logger.log('Using platform name stored as an environment variable');
          config.sauceOptions.platformName = process.env.PLATFORM_NAME;
        }

        Object.assign(capabilities, config.sauceOptions);
        break;

      case 'devicefarm':
        this.logger.log('Configuring the webdriver for DeviceFarm');

        let testGridUrlResult = '';
        // Get the endpoint to create a new session
        testGridUrlResult = await this.devicefarm
          .createTestGridUrl({
            projectArn: process.env.PROJECT_ARN,
            expiresInSeconds: 600,
          })
          .promise();

        builder.usingServer(testGridUrlResult.url);
        break;

      default:
        this.logger.log('Invalid host argument, using local host instead', LogLevel.WARN);
        break;
    }

    switch (this.testType) {
      case 'integration-test':
        this.logger.log('Using integration test default settings');
        builder.forBrowser('chrome');
        Object.assign(capabilities, config.chromeOptions);
        break;

      case `browser-compatibility`:
        this.logger.log('Using the provided browser compatibility config');
        client = JSON.parse(process.env.CLIENT);

        if (client.browserName === 'chrome') {
          builder.forBrowser('chrome');
          Object.assign(capabilities, config.chromeOptions);
        } else if (client.browserName === 'firefox') {
          builder.forBrowser('firefox');
          Object.assign(capabilities, config.firefoxOptions);
        } else if (client.browserName === 'safari') {
          this.numberOfSessions = 2;
          builder.forBrowser('safari');
          Object.assign(capabilities, config.safariOptions);
        } else {
          this.logger.log(
            `browserName: ${client.browserName} defined in the test config is not valid`,
            LogLevel.ERROR
          );
          throw new Error(`browserName defined in the test config is not valid`);
        }

        if (client.platform === 'android') {
          this.numberOfSessions = 2;
        }
        process.env.PLATFORM_NAME = client.platform;
        process.env.BROWSER_VERSION = client.browserVersion;

        break;

      default:
        this.logger.log('Using default settings');
        this.logger.log('Running chrome latest on MAC');
        builder.forBrowser('chrome');
        Object.assign(capabilities, config.chromeOptions);
        break;
    }

    builder.withCapabilities({
      ...capabilities,
    });

    return builder;
  }

  async build() {
    try {
      let builder = await this.configure();
      this.driver = builder.build();
    } catch (error) {
      this.logger.log(
        `Error occured while building a selenium webdriver, error: ${error}`,
        LogLevel.ERROR
      );
    }

    if (this.host === 'saucelabs') {
      const { id_ } = await this.driver.getSession();
      this.sessionId = id_;
      this.logger.log(
        `Successfully created a SauceLabs session at https://saucelabs.com/tests/${this.sessionId}`,
        LogLevel.SUCCESS
      );
      this.driver.executeScript('sauce:job-name=' + this.testName);
    }

    if (this.host === 'devicefarm') {
      const { id_ } = await this.driver.getSession();
      this.sessionId = id_;
      this.logger.log(
        `Successfully created a DeviceFarm session with id: ${this.sessionId}`,
        LogLevel.SUCCESS
      );
    }
  }

  async quit(testResult) {
    if (this.host === 'saucelabs') {
      this.driver.executeScript('sauce:job-result=' + testResult);
      this.logger.log(
        `See a video of the test run at https://saucelabs.com/tests/${this.sessionId}`,
        LogLevel.SUCCESS
      );
    }
    await this.driver.quit();
  }
}

module.exports = WebDriverFactory;
