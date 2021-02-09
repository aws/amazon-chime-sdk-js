const AppTestStep = require('../utils/AppTestStep');

class ClickHaveVideoTilesWithStreamsButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickHaveVideoTilesWithStreamsButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click HaveVideoTilesWithStreams button';
  }

  async run() {
    await this.page.clickHaveVideoTilesWithStreamsButton();
    this.finished('have_video_tiles_with_streams');
  }
}

module.exports = ClickHaveVideoTilesWithStreamsButton;
