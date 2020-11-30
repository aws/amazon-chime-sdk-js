const { KiteTestError, Status } = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class MeetingReadinessCheckerContentShareConnectivityCheck extends  AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new MeetingReadinessCheckerContentShareConnectivityCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if content share connectivity check succeed in meeting readiness checker';
  }

  metricName() {
    return 'MeetingReadinessCheckerContentShareConnectivityCheck'
  }

  async run() {
    const status = await this.page.checkContentShareConnectivitySucceed();
    this.logger('MeetingReadinessCheckerContentShareConnectivityCheck: ' + (status ? 'Succeeded' : 'Failed'));
    if (!status) {
      throw new KiteTestError(Status.FAILED, 'Content share connectivity check failed');
    }
  }
}

module.exports = MeetingReadinessCheckerContentShareConnectivityCheck;
