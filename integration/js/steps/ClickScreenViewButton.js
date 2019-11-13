const AppTestStep = require('../utils/AppTestStep');

class ClickScreenViewButton extends AppTestStep {
  constructor(kiteBaseTest, testType) {
    super(kiteBaseTest);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, testType) {
    const step = new ClickScreenViewButton(KiteBaseTest, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click screen view button';
  }

  async run() {
    await this.page.clickScreenViewButton();
    const message = this.testType === "ON" ? 'screen_view_start' : 'screen_view_stop';
    this.finished(message)
  }
}

module.exports = ClickScreenViewButton;
