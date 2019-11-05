const {TestStep, KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class RemoteAudioCheck extends AppTestStep {
  constructor(kiteBaseTest, testType) {
    super(kiteBaseTest);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, testType) {
    const step = new RemoteAudioCheck(KiteBaseTest, testType);
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
