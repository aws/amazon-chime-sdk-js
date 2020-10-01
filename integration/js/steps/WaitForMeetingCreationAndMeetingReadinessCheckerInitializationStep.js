const {KiteTestError, Status, TestUtils} = require('kite-common');
const AsyncAppWaitTestStep = require('../utils/AsyncAppWaitTestStep');

class WaitForMeetingCreationAndMeetingReadinessCheckerInitializationStep extends AsyncAppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForMeetingCreationAndMeetingReadinessCheckerInitializationStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  timeoutThresholdInMilliSeconds() {
    return 10000
  }

  stepDescription() {
    return 'Waiting for meeting to be created and meeting readiness checker to be initialized';
  }

  async waitCompleteCondition() {
    return await this.page.checkIfMeetingAuthenticatedAndMeetingReadinessCheckerInitialized()
  }

  waitCompleteMessage() {
    this.logger('Meeting created and meeting readiness checker initialized');
  }
}

module.exports = WaitForMeetingCreationAndMeetingReadinessCheckerInitializationStep;
