const { KiteTestError, Status } = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class MeetingReadinessCheckerVideoConnectivityCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new MeetingReadinessCheckerVideoConnectivityCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if video connectivity check succeed in meeting readiness checker';
  }

  metricName() {
    return 'MeetingReadinessCheckerVideoConnectivityCheck'
  }

  async run() {
    const status = await this.page.checkVideoConnectivitySucceed();
    this.logger('MeetingReadinessCheckerVideoConnectivityCheck: ' + (status ? 'Succeeded' : 'Failed'));
    if (!status) {
      throw new KiteTestError(Status.FAILED, 'Video connectivity check failed');
    }
  }
}

module.exports = MeetingReadinessCheckerVideoConnectivityCheck;
