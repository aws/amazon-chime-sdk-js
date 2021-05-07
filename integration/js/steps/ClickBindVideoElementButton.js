const AppTestStep = require('../utils/AppTestStep');

class ClickBindVideoElementButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, tile_id, video_element_id) {
    super(kiteBaseTest, sessionInfo);
    this.tile_id = tile_id;
    this.video_element_id = video_element_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo, tile_id, video_element_id) {
    const step = new ClickBindVideoElementButton(KiteBaseTest, sessionInfo, tile_id, video_element_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click BindVideoElement button';
  }

  async run() {
    await this.page.clickBindVideoElementButton(this.tile_id, this.video_element_id);
    this.finished('bind_video_element')
  }
}

module.exports = ClickBindVideoElementButton;
