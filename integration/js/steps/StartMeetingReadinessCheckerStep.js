const {KiteTestError, Status} = require('kite-common');
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
    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    };

    await this.page.startCheck();
    await sleep(10000);
  }
}

module.exports = StartMeetingReadinessCheckerStep;
