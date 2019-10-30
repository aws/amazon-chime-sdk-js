const {TestStep} = require('kite-common');
const {emitMetric} = require('./CloudWatch');

class AppTestStep extends TestStep {
  constructor(kiteBaseTest) {
    super();
    this.test = kiteBaseTest;
    this.url = kiteBaseTest.url;
    this.driver = kiteBaseTest.driver;
    this.timeout = kiteBaseTest.timeout;
    this.numberOfParticipant = kiteBaseTest.numberOfParticipant;
    this.page = kiteBaseTest.page;
    this.testReporter = kiteBaseTest.reporter;
  }

  async step() {
    if (this.test.failed) {
      console.log("Skipping step: " + this.stepDescription());
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