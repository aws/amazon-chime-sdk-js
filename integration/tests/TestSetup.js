const { before, after, afterEach } = require('mocha');
const WebDriverFactory = require('../utils/WebDriverFactory');
const SdkBaseTest = require('../utils/SdkBaseTest');
const { Logger, LogLevel } = require('../utils/Logger');
const { determineSessionCount } = require('../utils/ClientHelper');

/**
 * Sets up the test environment with WebDriver and handles test cleanup
 * @param {string} testName - Name of the test
 * @param {Object} Page - Page object class
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.requireTwoSessions=false] - Whether to require two sessions
 * @returns {Object} - Setup functions for the test
 */
function setupTestEnvironment(testName, Page, { requireTwoSessions = false } = {}) {
  return {
    /**
     * Sets up the base test environment with appropriate WebDriver instances
     */
    setupBaseTest: function () {
      let driverFactoryOne;
      let driverFactoryTwo;
      let baseTestConfigOne;
      let baseTestConfigTwo;
      let failureCount = 0;

      before(async function () {
        this.logger = new Logger(testName);
        this.logger.log('Retrieving the base test config');
        baseTestConfigOne = new SdkBaseTest();

        // Determine session count based on client info or explicit override
        const client = JSON.parse(process.env.CLIENT || '{}');
        let sessionCount = determineSessionCount(client, this.logger);

        if (requireTwoSessions && sessionCount < 2) {
          this.logger.log(
            `requireTwoSessions=true → forcing two sessions (was ${sessionCount})`
          );
          sessionCount = 2;
        }
        this.numberOfSessions = sessionCount;
        this.logger.log(`Setting up test with ${this.numberOfSessions} session(s)`);

        // Setup first driver
        this.logger.log('Configuring the first webdriver');
        driverFactoryOne = new WebDriverFactory(
          baseTestConfigOne.testName,
          baseTestConfigOne.host,
          baseTestConfigOne.testType,
          baseTestConfigOne.url,
          this.logger
        );
        await driverFactoryOne.build();
        this.driverFactoryOne = driverFactoryOne;
        this.baseTestConfigOne = baseTestConfigOne;

        // Create page object for first driver
        this.logger.log('Instantiating selenium helper class');
        this.pageOne = new Page(driverFactoryOne.driver, this.logger);

        // Setup second driver if needed
        if (this.numberOfSessions === 2) {
          this.logger.log('Configuring the second webdriver');
          baseTestConfigTwo = new SdkBaseTest();
          driverFactoryTwo = new WebDriverFactory(
            baseTestConfigTwo.testName,
            baseTestConfigTwo.host,
            baseTestConfigTwo.testType,
            baseTestConfigTwo.url,
            this.logger
          );
          await driverFactoryTwo.build();
          this.driverFactoryTwo = driverFactoryTwo;
          this.baseTestConfigTwo = baseTestConfigTwo;

          // Create page object for second driver
          this.pageTwo = new Page(driverFactoryTwo.driver, this.logger);
        }
      });

      afterEach(async function () {
        if (this.currentTest.state === 'failed') failureCount += 1;
        this.logger.printLogs();
      });

      after(async function () {
        this.logger.log('Closing the webdriver(s)');
        const passed = failureCount === 0;

        await driverFactoryOne.quit(passed);

        if (this.numberOfSessions === 2 && driverFactoryTwo) {
          await driverFactoryTwo.quit(passed);
        }

        if (passed === true) {
          this.logger.log(`${testName} finished and the result: passed!`, LogLevel.SUCCESS);
          process.exit(0);
        } else {
          this.logger.log(`${testName} finished and the result: failed!`, LogLevel.ERROR);
          process.exit(1);
        }
      });
    }
  };
}

module.exports = setupTestEnvironment;
