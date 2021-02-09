const AppTestStep = require('../utils/AppTestStep');

class ClickSendTileStateUpdateButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new ClickSendTileStateUpdateButton(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click send tile state update button';
  }

  async run() {
    await this.page.clickSendTileStateUpdateButton();
    this.finished('send_tile_state_update');
  }
}

module.exports = ClickSendTileStateUpdateButton;
 