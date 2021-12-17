const {TestStep, KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class RemoteAudioCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType, checkStereoTones) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
    this.checkStereoTones = checkStereoTones;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType, checkStereoTones = false) {
    const step = new RemoteAudioCheck(KiteBaseTest, sessionInfo, testType, checkStereoTones);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the remote audio';
  }

  metricName() {
    return `Check the remote audio for ${this.checkStereoTones ? 'stereo' : 'mono'} tone`;
  }

  async run() {
    const passed = await this.page.audioCheck(this, this.testType, this.checkStereoTones);
    if (!passed) {
      throw new KiteTestError(Status.FAILED, `Audio check failed for ${this.checkStereoTones ? 'stereo' : 'mono'} tone`);
    }
    this.finished("audio_check_complete");
  }
}

module.exports = RemoteAudioCheck;
