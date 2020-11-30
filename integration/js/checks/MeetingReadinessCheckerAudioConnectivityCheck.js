const { KiteTestError, Status } = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class MeetingReadinessCheckerAudioConnectivityCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new MeetingReadinessCheckerAudioConnectivityCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if audio connectivity check succeed in meeting readiness checker';
  }

  metricName() {
    return 'MeetingReadinessCheckerAudioConnectivityCheck'
  }

  async run() {
    const status = await this.page.checkAudioConnectivitySucceed();
    this.logger('MeetingReadinessCheckerAudioConnectivityCheck: ' + (status ? 'Succeeded' : 'Failed'));
    if (!status) {
      throw new KiteTestError(Status.FAILED, 'Audio connectivity check failed');
    }
  }
}

module.exports = MeetingReadinessCheckerAudioConnectivityCheck;
