const AppTestStep = require('../utils/AppTestStep');

class ClickMediaCaptureButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickMediaCaptureButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click media capture button';
  }

  async run() {
    await this.page.clickMediaCaptureButton();
  }
}

module.exports = ClickMediaCaptureButton;
