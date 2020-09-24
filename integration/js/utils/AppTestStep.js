const {KiteTestError, TestStep, Status} = require('kite-common');
const {emitMetric} = require('./CloudWatch');

class AppTestStep extends TestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super();
    // this information is common for a test
    this.test = kiteBaseTest;
    this.url = kiteBaseTest.url;
    this.timeout = kiteBaseTest.timeout;
    this.numberOfParticipant = kiteBaseTest.numberOfParticipant;
    this.testReporter = kiteBaseTest.reporter;

    // this is different if we have multiple sessions
    if (sessionInfo) {
      this.logger = sessionInfo.logger;
      this.page = sessionInfo.page;
      this.driver = sessionInfo.driver;
    }
  }

  async step() {
    if (this.test.remoteFailed || this.test.failedTest) {
      this.logger("Skipping: " + this.stepDescription());
      return;
    }
    try {
      await this.run();
    } catch (error) {
      this.failed();
      throw error;
    }
    this.emitCwMetric(1);
  }

  metricName() {
    return ""
  }

  async run() {
  }

  emitMetricToCommonNamespace() {
    return false
  }

  failed() {
    this.test.failedTest = true;
    this.emitCwMetric(0);
    if (this.test.io == undefined) {
      return;
    }
    this.test.io.emit('failed', this.metricName());
  }

  emitCwMetric(value) {
    if (this.metricName() === "") {
      return;
    }
    if (this.emitMetricToCommonNamespace()) {
      emitMetric("Common", this.test.capabilities, this.metricName(), value);
    }
    emitMetric(this.test.testName, this.test.capabilities, this.metricName(), value);
  }

  finished(message, data) {
    if (this.test.io == undefined) {
      return;
    }
    data == null ? this.test.io.emit(message) : this.test.io.emit(message, data);
  }
}

module.exports = AppTestStep;