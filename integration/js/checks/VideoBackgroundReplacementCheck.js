const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class VideoBackgroundReplacementCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendeeId) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
  }
  static async executeStep(KiteBaseTest, sessionInfo, attendeeId) {
    const step = new VideoBackgroundReplacementCheck(KiteBaseTest, sessionInfo, attendeeId);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check video replacement';
  }

  async run() {
      const videoBackgroundReplacementCheck = await this.page.backgroundReplacementCheck(this.attendeeId);
      if (!videoBackgroundReplacementCheck) {
        throw new KiteTestError(Status.FAILED, `Video replacement failed`);
      }
      this.finished("Video replacement success");
  }
}

module.exports = VideoBackgroundReplacementCheck;
