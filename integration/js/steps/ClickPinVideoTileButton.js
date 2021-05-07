const AppTestStep = require('../utils/AppTestStep');

class ClickPinVideoTileButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendee_id) {
    super(kiteBaseTest, sessionInfo);
    this.attendee_id = attendee_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendee_id) {
    const step = new ClickPinVideoTileButton(KiteBaseTest, sessionInfo, attendee_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click PinVideoTile button';
  }

  async run() {
    await this.page.clickPinVideoTileButton(this.attendee_id);
    this.finished('pin_video_tile')
  }
}

module.exports = ClickPinVideoTileButton;