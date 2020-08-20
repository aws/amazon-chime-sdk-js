const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class ContentShareVideoCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType, attendeeName) {
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
    this.attendeeName = attendeeName;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType, attendeeName) {
    const step = new ContentShareVideoCheck(KiteBaseTest, sessionInfo, testType, attendeeName);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check the content share video with attendee name ' + this.attendeeName + " is " + this.expectedState;
  }

  async run() {
    try {
      const result = await this.page.videoCheckByAttendeeName(this, this.attendeeName, this.expectedState);
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
