const AppTestStep = require('../utils/AppTestStep');

class ClickUnpinVideoTileButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendee_id) {
    super(kiteBaseTest, sessionInfo);
    this.attendee_id = attendee_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendee_id) {
    const step = new ClickUnpinVideoTileButton(KiteBaseTest, sessionInfo, attendee_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click UnpinVideoTile button';
  }

  async run() {
    await this.page.clickUnpinVideoTileButton(this.attendee_id);
    this.finished('unpin_video_tile')
  }
}

module.exports = ClickUnpinVideoTileButton; 
