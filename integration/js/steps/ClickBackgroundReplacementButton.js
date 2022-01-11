const AppTestStep = require('../utils/AppTestStep');

class ClickBackgroundReplacementButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickBackgroundReplacementButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click Background replacement button';
  }

  async run() {
    await this.page.clickVideoFilterDropButton();
    await this.page.clickBackgroundReplacementFilterFromDropDownMenu();
  }
}

module.exports = ClickBackgroundReplacementButton;
