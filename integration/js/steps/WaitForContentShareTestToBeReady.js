const {KiteTestError, Status, TestUtils} = require('kite-common');
const AsyncAppWaitTestStep = require('../utils/AsyncAppWaitTestStep');

class WaitForContentShareTestToBeReady extends AsyncAppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForContentShareTestToBeReady(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for content share test to be ready';
  }

  async waitCompleteCondition() {
    return await this.page.isTestContentShareConnectivityButtonEnabled()
  }

  waitCompleteMessage() {
    this.logger('Content share connectivity check enabled');
  }
}

module.exports = WaitForContentShareTestToBeReady;
