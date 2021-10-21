const AppTestStep = require('../utils/AppTestStep');

class ClickBackgroundBlurButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickBackgroundBlurButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click Background blur button';
  }

  async run() {
    await this.page.clickVideoFilterDropButton();
    await this.page.clickBackgroundBlurFilterFromDropDownMenu();
  }
}

module.exports = ClickBackgroundBlurButton;
