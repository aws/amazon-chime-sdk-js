const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class StartMeetingReadinessCheckerStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new StartMeetingReadinessCheckerStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start meeting readiness checker';
  }

  metricName() {
    return 'StartMeetingReadinessChecker'
  }

  async run() {
    await this.page.startCheck();
    await TestUtils.waitAround(5000);
  }
}

module.exports = StartMeetingReadinessCheckerStep;
