const AppTestStep = require('../utils/AppTestStep');

class ClickHaveVideoTileForAttendeeIdButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendeeId) {
    super(kiteBaseTest, sessionInfo, attendeeId);
    this.attendeeId = attendeeId;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendeeId) {
    const step = new ClickHaveVideoTileForAttendeeIdButton(KiteBaseTest, sessionInfo, attendeeId);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click haveVideoTileForAttendeeId button';
  }

  async run() {
    await this.page.clickHaveVideoTileForAttendeeIdButton(this.attendeeId);
    this.finished('have_video_tile_for_attendeeId');
  }
}

module.exports = ClickHaveVideoTileForAttendeeIdButton;
