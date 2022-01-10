const AppTestStep = require('../utils/AppTestStep');
const { KiteTestError, Status, TestUtils } = require('kite-common');

class VideoBackgroundBlurCheck extends AppTestStep {

  filter_type;

  constructor(kiteBaseTest, sessionInfo, attendeeId, filter_type) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
    this.filter_type = filter_type;
  }
  static async executeStep(KiteBaseTest, sessionInfo, attendeeId, filter_type) {
    const step = new VideoBackgroundBlurCheck(KiteBaseTest, sessionInfo, attendeeId, filter_type);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check background filter';
  }

  async runCheck() {
    if (this.filter_type === 'blur') {
      return await this.page.backgroundBlurCheck(this.attendeeId);
    }
    else {
      return await this.page.backgroundReplacementCheck(this.attendeeId);
    }
  }

  async run() {
    let videoBackgroundBlurCheck; // Result of the verification
    let i = 0; // iteration indicator
    let timeout = 10;
    videoBackgroundBlurCheck = await this.runCheck();
    while ((!videoBackgroundBlurCheck) && i < timeout) {
      videoBackgroundBlurCheck = await this.runCheck();
      i++;
      await TestUtils.waitAround(1000);
    }
    if (!videoBackgroundBlurCheck) {
      throw new KiteTestError(Status.FAILED, `Background filter check failed`);
    }
    this.finished("Background filter check success");
  }
}

module.exports = VideoBackgroundBlurCheck;
