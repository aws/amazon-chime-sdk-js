const AppTestStep = require('../utils/AppTestStep');

class ClickGetLocalVideoTileButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickGetLocalVideoTileButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click getLocalVideoTile button';
  }

  async run() {
    await this.page.clickGetLocalVideoTileButton();
    this.finished('get_local_video_tile');
  }
}

module.exports = ClickGetLocalVideoTileButton;
