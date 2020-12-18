const AppTestStep = require('../utils/AppTestStep');

class ClickVideoFilterButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickVideoFilterButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click VideoProcessor button';
  }

  async run() {
    await this.page.clickVideoFilterDropButton();
    await this.page.clickVideoFilterFromDropDownMenu();
  }
}

module.exports = ClickVideoFilterButton;
