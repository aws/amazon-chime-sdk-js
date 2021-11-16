const AppTestStep = require('../utils/AppTestStep');

class StartAmazonVoiceFocus extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new StartAmazonVoiceFocus(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start Amazon Voice Focus';
  }
  
  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    await this.page.clickStartAmazonVoiceFocus();
  }
}

module.exports = StartAmazonVoiceFocus;
