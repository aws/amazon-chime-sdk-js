const AppTestStep = require('../utils/AppTestStep');

class ClickAddVideotileButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickAddVideotileButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click addVideoTile button';
  }

  async run() {
    await this.page.clickAddVideoTileButton();
    this.finished('add_video_tile');
  }
}

module.exports = ClickAddVideotileButton;
