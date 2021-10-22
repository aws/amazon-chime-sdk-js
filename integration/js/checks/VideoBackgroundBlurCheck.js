const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class VideoBackgroundBlurCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendeeId) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
  }
  static async executeStep(KiteBaseTest, sessionInfo, attendeeId) {
    const step = new VideoBackgroundBlurCheck(KiteBaseTest, sessionInfo, attendeeId);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check video blur';
  }

  async run() {
      const videoBackgroundBlurcheck = await this.page.backgroundBlurCheck(this.attendeeId);
      if (!videoBackgroundBlurcheck) {
        throw new KiteTestError(Status.FAILED, `Video blur failed`);
      }
      this.finished("Video blur success");
  }
}

module.exports = VideoBackgroundBlurCheck;
