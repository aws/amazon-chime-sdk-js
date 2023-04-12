const AppTestStep = require('../utils/AppTestStep');

class ClickVideoFxBackgroundReplacementButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickVideoFxBackgroundReplacementButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click Video Fx Background Replacement button';
  }

  async run() {
    await this.page.clickVideoFilterDropButton();
    await this.page.clickVideoFxBackgroundReplacementFilterFromDropDownMenu();
  }
}

module.exports = ClickVideoFxBackgroundReplacementButton;
