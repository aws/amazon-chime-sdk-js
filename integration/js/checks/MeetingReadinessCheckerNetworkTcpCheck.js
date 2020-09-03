const { KiteTestError, Status } = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class MeetingReadinessCheckerNetworkTcpCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new MeetingReadinessCheckerNetworkTcpCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if network TCP check succeed in meeting readiness checker';
  }

  metricName() {
    return 'MeetingReadinessCheckerNetworkTcpCheck'
  }

  async run() {
    const status = await this.page.checkNetworkTCPConnectivitySucceed();
    this.logger('MeetingReadinessCheckerNetworkTcpCheck: ' + (status ? 'Succeeded' : 'Failed'));
    if (!status) {
      throw new KiteTestError(Status.FAILED, 'Network TCP check failed');
    }
  }
}

module.exports = MeetingReadinessCheckerNetworkTcpCheck;
