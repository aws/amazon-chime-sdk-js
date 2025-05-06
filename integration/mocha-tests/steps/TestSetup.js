const { before, after, afterEach } = require('mocha');
const WebDriverFactory = require('../utils/WebDriverFactory');
const SdkBaseTest = require('../utils/SdkBaseTest');
const { Logger, LogLevel } = require('../utils/Logger');
const MeetingPage = require('../pages/MeetingPage');

/**
 * Sets up the test environment with WebDriver and handles test cleanup
 * @param {string} testName - Name of the test
 * @returns {Object} - Setup functions for the test
 */
function setupTestEnvironment(testName) {
  return {
    /**
     * Sets up the base test environment with a single WebDriver instance
     */
    setupBaseTest: function() {
      let driverFactoryOne;
      let baseTestConfigOne;
      let failureCount = 0;

      before(async function() {
        failureCount = 0;
        this.logger = new Logger(testName);
        this.logger.log('Retrieving the base test config');
        baseTestConfigOne = new SdkBaseTest();
        this.logger.log('Configuring the webdriver');
        driverFactoryOne = new WebDriverFactory(
          baseTestConfigOne.testName,
          baseTestConfigOne.host,
          baseTestConfigOne.testType,
          baseTestConfigOne.url
        );
        await driverFactoryOne.build();
        this.logger.log('Using the webdriver, opening the first browser window');
        this.numberOfSessions = driverFactoryOne.numberOfSessions;
        await driverFactoryOne.driver.manage().window().maximize();
        this.driverFactoryOne = driverFactoryOne;
        this.baseTestConfigOne = baseTestConfigOne;
        this.pageOne = new MeetingPage(driverFactoryOne.driver, this.logger);
        if (this.numberOfSessions > 1) {

        }
      });

      afterEach(async function() {
        if (this.currentTest.state === 'failed') failureCount += 1;
        this.logger.printLogs();
      });

      after(async function() {
        this.logger.log('Closing the webdriver');
        const passed = failureCount === 0;

        await driverFactoryOne.quit(passed);

        if (passed === true) {
          this.logger.log(`${testName} passed!!!`, LogLevel.SUCCESS);
          process.exit(0);
        } else {
          this.logger.log(`${testName} failed!!!`, LogLevel.ERROR);
          process.exit(1);
        }
      });
    }
  };
}

module.exports = setupTestEnvironment;
