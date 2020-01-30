const {TestStep, KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class RemoteAudioCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new RemoteAudioCheck(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the remote audio';
  }

  metricName() {
    return `RemoteAudio${this.testType == 'AUDIO_ON' ? 'Enabled' : 'Disabled'}Check`
  }

  async run() {
    const passed = await this.page.audioCheck(this, this.testType);
    if (!passed) {
      throw new KiteTestError(Status.FAILED, 'Audio check failed');
    }
    this.finished("audio_check_complete");
  }
}

module.exports = RemoteAudioCheck;
