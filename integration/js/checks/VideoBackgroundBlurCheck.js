const AppTestStep = require('../utils/AppTestStep');
const { KiteTestError, Status, TestUtils } = require('kite-common');

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
    let videoBackgroundBlurcheck; // Result of the verification
    let i = 0; // iteration indicator
    let timeout = 10;
    videoBackgroundBlurcheck = await this.page.backgroundBlurCheck(this.attendeeId);
    while ((!videoBackgroundBlurcheck) && i < timeout) {
      videoBackgroundBlurcheck = await this.page.backgroundBlurCheck(this.attendeeId);
      i++;
      await TestUtils.waitAround(1000);
    }
    if (!videoBackgroundBlurcheck) {
      throw new KiteTestError(Status.FAILED, `Video blur failed`);
    }
    this.finished("Video blur success");
  }
}

module.exports = VideoBackgroundBlurCheck;
