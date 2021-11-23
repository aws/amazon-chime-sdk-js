const {TestStep, KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class EchoAudioCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, expectedState) {
    super(kiteBaseTest, sessionInfo);
    this.expectedState = expectedState;
  }

  static async executeStep(KiteBaseTest, sessionInfo, expectedState) {
    const step = new EchoAudioCheck(KiteBaseTest, sessionInfo, expectedState);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the remote audio for echo test';
  }

  metricName() {
    return `RemoteAudio${this.testType == 'AUDIO_ON' ? 'Enabled' : 'Disabled'}Check`
  }

  async run() {
    const passed = await this.page.echoAudioCheck(this, this.expectedState);
    if (!passed) {
      throw new KiteTestError(Status.FAILED, 'Audio check failed');
    }
    this.finished("audio_check_complete");
  }
}

module.exports = EchoAudioCheck;
