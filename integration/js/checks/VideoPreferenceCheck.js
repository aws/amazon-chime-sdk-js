const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class VideoPreferenceCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, attendeeId, priority, targetSize) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
    this.priority = priority;
    this.targetSize = targetSize;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendeeId, priority, targetSize) {
    const step = new VideoPreferenceCheck(KiteBaseTest, sessionInfo, attendeeId, priority, targetSize);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check videoPreference';
  }

  async run() {
      const videoPreferenceCheckPassed = await this.page.videoPreferenceCheck(this.attendeeId, this.priority, this.targetSize);
      if (!videoPreferenceCheckPassed) {
        throw new KiteTestError(Status.FAILED, `VideoPreference attendee: ${this.attendeeId}, priority: ${this.priority}, targetSize: ${this.targetSize} was not correct`);
      }
  }
}

module.exports = VideoPreferenceCheck;
