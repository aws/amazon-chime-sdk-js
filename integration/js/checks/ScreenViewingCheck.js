const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class ScreenViewingCheck extends AppTestStep {
  constructor(kiteBaseTest, testType, metricName) {
    super(kiteBaseTest);
    this.expectedState = testType === 'SCREEN_SHARING_ON' ? 'video' : 'blank';
    this.metric = metricName;
  }

  static async executeStep(KiteBaseTest, testType, metricName) {
    const step = new ScreenViewingCheck(KiteBaseTest, testType, metricName);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the screen view to be: ' + this.expectedState;
  }

  metricName() {
    return this.metric;
  }

  async run() {
    await TestUtils.waitAround(5000);
    try {
      let result = await this.page.checkScreenShare(this.expectedState);
      if (result !== this.expectedState) {
        this.testReporter.textAttachment(this.report, 'Shared screen', result, 'plain');
        throw new KiteTestError(Status.FAILED, 'The shared screen ' + result);
      }
    } catch (error) {
      console.log(error);
      if (error instanceof KiteTestError) {
        throw error;
      } else {
        throw new KiteTestError(Status.BROKEN, 'Error looking for shared screen');
      }
    }
    this.finished(`screen_viewing_${this.expectedState == 'video' ? 'on' : 'off'}`)
  }
}

module.exports = ScreenViewingCheck;
