const {TestStep, KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class RemoteVideoCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new RemoteVideoCheck(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the remote videos';
  }

  metricName() {
    return `RemoteVideo${this.testType == 'VIDEO_ON' ? 'Enabled': 'Disabled'}Check`
  }

  async run() {
    try {
      let expectedState = this.testType == "VIDEO_ON" ? 'video' : 'blank';
      let result = '';
      let tmp;
      let error = false;
      for (let i = 1; i < this.numberOfParticipant; i++) {
        tmp = await this.page.videoCheck(this, i, expectedState);
        result += tmp;
        if (i < this.numberOfParticipant) {
          result += ' | ';
        }
        if (tmp != expectedState) {
          error = true;
        }
      }
      if (error) {
        this.testReporter.textAttachment(this.report, 'Remote videos', result, 'plain');
        throw new KiteTestError(Status.FAILED, 'Some remote videos are : ' + result);
      }
    } catch (error) {
      this.logger(error);
      if (error instanceof KiteTestError) {
        throw error;
      } else {
        throw new KiteTestError(Status.BROKEN, 'Error looking for the remote video');
      }
    }
    this.finished("video_check_complete");
  }
}

module.exports = RemoteVideoCheck;
