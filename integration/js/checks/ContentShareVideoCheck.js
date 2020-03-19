const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class ContentShareVideoCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType, videoIndex) {
    super(kiteBaseTest, sessionInfo);
    switch(testType) {
      case 'ON':
        this.expectedState = 'video';
        break;
      case 'PAUSE':
        this.expectedState = 'still';
        break;
      default:
        this.expectedState = 'blank';
    }
    this.videoIndex = videoIndex;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType, videoIndex) {
    const step = new ContentShareVideoCheck(KiteBaseTest, sessionInfo, testType, videoIndex);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the content share video in video index ' + this.videoIndex + " is " + this.expectedState;
  }

  async run() {
    try {
      const result = await this.page.videoCheck(this, this.videoIndex, this.expectedState);
      if (result !== this.expectedState) {
        this.testReporter.textAttachment(this.report, 'Content share video', result, 'plain');
        throw new KiteTestError(Status.FAILED, 'The content share video is ' + result);
      }

    } catch (error) {
      this.logger(error);
      if (error instanceof KiteTestError) {
        throw error;
      } else {
        throw new KiteTestError(Status.BROKEN, 'Error looking for content share video');
      }
    }
    this.finished(`content_share_${this.expectedState == 'video' ? 'on' : 'off'}`)
  }
}

module.exports = ContentShareVideoCheck;
