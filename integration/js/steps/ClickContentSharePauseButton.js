const AppTestStep = require('../utils/AppTestStep');

class ClickContentSharePauseButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new ClickContentSharePauseButton(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click content share pause button to ' + (this.testType === 'ON' ? 'pause' : 'unpause');
  }

  async run() {
    await this.page.clickContentSharePauseButton();
    const message = this.testType === 'ON' ? 'content_share_pause' : 'content_share_unpause';
    this.finished(message)
  }
}

module.exports = ClickContentSharePauseButton;
