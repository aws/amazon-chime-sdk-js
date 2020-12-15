const AppTestStep = require('../utils/AppTestStep');

class ClickStartLocalVideoButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickStartLocalVideoButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click start local video tile button';
  }

  async run() {
    await this.page.clickStartLocalVideoButton();
    this.finished('start_local_video_tile');
  }
}

module.exports = ClickStartLocalVideoButton;
