const AppTestStep = require('../utils/AppTestStep');

class ClickGetAllVideoTilesButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickGetAllVideoTilesButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click getAllVideoTiles button';
  }

  async run() {
    await this.page.clickGetAllVideoTilesButton();
    this.finished('get_all_video_tiles');
  }
}

module.exports = ClickGetAllVideoTilesButton;
