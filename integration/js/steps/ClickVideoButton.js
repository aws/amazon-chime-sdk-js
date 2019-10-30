const AppTestStep = require('../utils/AppTestStep');

class ClickVideoButton extends AppTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new ClickVideoButton(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click video button';
  }

  async run() {
    await this.page.clickCameraButton();
  }
}

module.exports = ClickVideoButton;
