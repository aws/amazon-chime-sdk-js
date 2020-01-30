const AppTestStep = require('../utils/AppTestStep');

class ClickScreenShareButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new ClickScreenShareButton(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click screen share button';
  }

  async run() {
    await this.page.clickScreenShareButton();
    const message = this.testType === "ON" ? 'screen_share_start' : 'screen_share_stop';
    this.finished(message)
  }
}

module.exports = ClickScreenShareButton;
