const AppTestStep = require('../utils/AppTestStep');

class ClickHasStartedLocalVideoTileButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickHasStartedLocalVideoTileButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click hasStartedLocalVideoTile button';
  }

  async run() {
    await this.page.clickHasStartedLocalVideoTileButton();
    this.finished('has_started_local_video_tile');
  }
}

module.exports = ClickHasStartedLocalVideoTileButton;
