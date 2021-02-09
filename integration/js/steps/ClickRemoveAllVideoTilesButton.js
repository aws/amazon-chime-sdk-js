const AppTestStep = require('../utils/AppTestStep');

class ClickRemoveAllVideoTilesButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickRemoveAllVideoTilesButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click removeAllVideoTiles button';
  }

  async run() {
    await this.page.clickRemoveAllVideoTilesButton();
    this.finished('remove_all_video_tiles');
  }
}

module.exports = ClickRemoveAllVideoTilesButton;
 