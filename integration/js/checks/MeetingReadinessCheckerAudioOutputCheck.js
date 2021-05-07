const { KiteTestError, Status } = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class MeetingReadinessCheckerAudioOutputCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new MeetingReadinessCheckerAudioOutputCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if audio output check succeed in meeting readiness checker';
  }

  metricName() {
    return 'MeetingReadinessCheckerAudioOutputCheck'
  }

  async run() {
    await this.page.startSpeakerTest();
    const status = await this.page.checkSpeakerTestSucceed();
    this.logger('MeetingReadinessCheckerAudioOutputCheck: ' + (status ? 'Succeeded' : 'Failed'));
    if (!status) {
      throw new KiteTestError(Status.FAILED, 'Audio output check failed');
    }
  }
}

module.exports = MeetingReadinessCheckerAudioOutputCheck;
