const AppTestStep = require('../utils/AppTestStep');

class ClickHaveVideoTileForAttendeeIdButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickHaveVideoTileForAttendeeIdButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click haveVideoTileForAttendeeId button';
  }

  async run() {
    await this.page.clickHaveVideoTileForAttendeeIdButton();
    this.finished('have_video_tile_for_attendeeId');
  }
}

module.exports = ClickHaveVideoTileForAttendeeIdButton;
