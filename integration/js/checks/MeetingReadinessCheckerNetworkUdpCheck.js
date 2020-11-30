const { KiteTestError, Status } = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class MeetingReadinessCheckerNetworkUdpCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new MeetingReadinessCheckerNetworkUdpCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if network UDP check succeed in meeting readiness checker';
  }

  metricName() {
    return 'MeetingReadinessCheckerNetworkUdpCheck'
  }

  async run() {
    const status = await this.page.checkNetworkUDPConnectivitySucceed();
    this.logger('MeetingReadinessCheckerNetworkUdpCheck: ' + (status ? 'Succeeded' : 'Failed'));
    if (!status) {
      throw new KiteTestError(Status.FAILED, 'Network UDP check failed');
    }
  }
}

module.exports = MeetingReadinessCheckerNetworkUdpCheck;
