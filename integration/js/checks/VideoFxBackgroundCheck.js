const AppTestStep = require('../utils/AppTestStep');
const { KiteTestError, Status, TestUtils } = require('kite-common');

class VideoFxBackgroundCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendeeId, filterType, rawVideoSum) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
    this.filterType = filterType;
    this.rawVideoSum = rawVideoSum;
  }
  static async executeStep(KiteBaseTest, sessionInfo, attendeeId, filterType, rawVideoSum) {
    const step = new VideoFxBackgroundCheck(KiteBaseTest, sessionInfo, attendeeId, filterType, rawVideoSum);
    await step.execute(KiteBaseTest);
  }

  isBlurFilter() {
    return this.filterType === 'video fx blur';
  }

  filterTypeDescription() {
    return this.isBlurFilter() ? 'video fx background blur' : 'video fx background replacement';
  }

  stepDescription() {
    return 'Check ' + this.filterTypeDescription();
  }

  async runCheck() {
    if (this.isBlurFilter()) {
      return await this.page.videoFxBackgroundBlurCheck(this.attendeeId, this.rawVideoSum);
    } else {
      return await this.page.videoFxBackgroundReplacementCheck(this.attendeeId, this.rawVideoSum);
    }
  }

  async run() {
    let videoFxBackgroundCheck; // Result of the verification
    let i = 0; // iteration indicator
    let timeout = 10;
    videoFxBackgroundCheck = await this.runCheck();
    while (!videoFxBackgroundCheck && i < timeout) {
      videoFxBackgroundCheck = await this.runCheck();
      i++;
      await TestUtils.waitAround(1000);
    }
    if (!videoFxBackgroundCheck) {
      throw new KiteTestError(Status.FAILED, this.filterTypeDescription() + ' check failed');
    }
    this.finished(this.filterTypeDescription() + ' check success');
  }
}

module.exports = VideoFxBackgroundCheck;
