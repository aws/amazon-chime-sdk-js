const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class LocalVideoCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.expectedState = testType === 'VIDEO_ON' ? 'video' : 'blank';
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new LocalVideoCheck(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the local video to be: ' + this.expectedState;
  }

  metricName() {
    return `LocalVideo${this.expectedState == 'video' ? 'Enabled': 'Disabled'}Check`
  }

  async run() {
    try {
      let result = await this.page.videoCheck(this, 17, this.expectedState);
      if (result !== this.expectedState) {
        this.testReporter.textAttachment(this.report, 'Sent video', result, 'plain');
        throw new KiteTestError(Status.FAILED, 'The video sent is ' + result);
      }
    } catch (error) {
      this.logger(error);
      if (error instanceof KiteTestError) {
        throw error;
      } else {
        throw new KiteTestError(Status.BROKEN, 'Error looking for local video');
      }
    }
    this.finished(`local_video_${this.expectedState == 'video' ? 'on' : 'off'}`)
  }
}

module.exports = LocalVideoCheck;
