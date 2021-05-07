const AppTestStep = require('../utils/AppTestStep');

class ClickUnbindVideoElementButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, tile_id) {
    super(kiteBaseTest, sessionInfo);
    this.tile_id = tile_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo, tile_id) {
    const step = new ClickUnbindVideoElementButton(KiteBaseTest, sessionInfo, tile_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click unbindVideoElement button';
  }

  async run() {
    await this.page.clickUnbindVideoElementButton(this.tile_id);
    this.finished('unbind_video_element')
  }
}

module.exports = ClickUnbindVideoElementButton;
