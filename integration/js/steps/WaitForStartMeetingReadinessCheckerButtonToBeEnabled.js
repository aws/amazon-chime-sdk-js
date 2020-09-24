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

  stepDescription() {
    return 'Waiting for meeting to be created and start button to be ready';
  }

  async waitCompleteCondition() {
    return await this.page.isStartMeetingReadinessCheckerButtonEnabled()
  }

  waitCompleteMessage() {
    this.logger('Meeting is created and start button is enabled');
  }
}

module.exports = WaitForStartMeetingReadinessCheckerButtonToBeEnabled;
