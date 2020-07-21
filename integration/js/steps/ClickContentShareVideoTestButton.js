const AppTestStep = require('../utils/AppTestStep');

class ClickContentShareVideoTestButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new ClickContentShareVideoTestButton(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click content share video test button to turn ' + (this.testType === 'ON' ? 'on' : 'off') + ' content share video test';
  }

  async run() {
    await this.page.clickContentShareDropButton();
    await this.page.clickContentShareVideoTestButton();
    const message = this.testType === "ON" ? 'content_share_video_test_start' : 'content_share_video_test_stop';
    this.finished(message)
  }
}

module.exports = ClickContentShareVideoTestButton;
