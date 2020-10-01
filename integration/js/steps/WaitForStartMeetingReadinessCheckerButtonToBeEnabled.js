const {KiteTestError, Status, TestUtils} = require('kite-common');
const AsyncAppWaitTestStep = require('../utils/AsyncAppWaitTestStep');

class WaitForStartMeetingReadinessCheckerButtonToBeEnabled extends AsyncAppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForStartMeetingReadinessCheckerButtonToBeEnabled(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  timeoutThresholdInMilliSeconds() {
    return 10000
  }

  stepDescription() {
    return 'Waiting for logger and device controller to be initialized and start button to be ready';
  }

  async waitCompleteCondition() {
    return await this.page.isStartMeetingReadinessCheckerButtonEnabled()
  }

  waitCompleteMessage() {
    this.logger('Logger and device controller is created and start button is enabled');
  }
}

module.exports = WaitForStartMeetingReadinessCheckerButtonToBeEnabled;
