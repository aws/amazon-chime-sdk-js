const AppTestStep = require('../utils/AppTestStep');

class ClickStopLocalVideoButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickStopLocalVideoButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click stop local video tile button';
  }

  async run() {
    await this.page.clickStopLocalVideoButton();
    this.finished('stop_local_video_tile');
  }
}

module.exports = ClickStopLocalVideoButton;
