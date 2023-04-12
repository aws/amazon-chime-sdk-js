const AppTestStep = require('../utils/AppTestStep');

class ClickVideoFxBackgroundBlurButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickVideoFxBackgroundBlurButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click Video Fx Background Blur button';
  }

  async run() {
    await this.page.clickVideoFilterDropButton();
    await this.page.clickVideoFxBackgroundBlurFilterFromDropDownMenu();
  }
}

module.exports = ClickVideoFxBackgroundBlurButton;
