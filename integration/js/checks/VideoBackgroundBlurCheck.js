const AppTestStep = require('../utils/AppTestStep');
const { KiteTestError, Status, TestUtils } = require('kite-common');

class VideoBackgroundBlurCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, attendeeId, filter_type) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
    this.filter_type = filter_type;
  }
  static async executeStep(KiteBaseTest, sessionInfo, attendeeId, filter_type) {
    const step = new VideoBackgroundBlurCheck(KiteBaseTest, sessionInfo, attendeeId, filter_type);
    await step.execute(KiteBaseTest);
  }

  isBlurFilter() {
    return this.filter_type === 'blur';
  }

  filterTypeDescription() {
    return this.isBlurFilter() ? 'background blur' : 'background replacement';
  }

  stepDescription() {
    return "Check " + this.filterTypeDescription(); 
  }

  async runCheck() {
    if (this.isBlurFilter()) {
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
      throw new KiteTestError(Status.FAILED, this.filterTypeDescription() + ' check failed');
    }
    this.finished(this.filterTypeDescription() + ' check success');
  }
}

module.exports = VideoBackgroundBlurCheck;
