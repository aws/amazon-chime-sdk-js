const AppTestStep = require('../utils/AppTestStep');

class ClickGetAllRemoteVideoTilesButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickGetAllRemoteVideoTilesButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click getAllRemoteVideoTiles button';
  }

  async run() {
    await this.page.clickGetAllRemoteVideoTilesButton();
    this.finished('get_all_remote_video_tiles');
  }
}

module.exports = ClickGetAllRemoteVideoTilesButton;
