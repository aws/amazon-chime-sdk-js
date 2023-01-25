const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class ClickContentShareButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new ClickContentShareButton(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click content share button to turn ' + (this.testType === 'ON' ? 'on' : 'off') + ' content share';
  }

  async run() {
    let isButtonClickable = await this.page.waitForContentShareButton();
    if (isButtonClickable === 'failed') {
      throw new KiteTestError(Status.BROKEN, 'Content share button is not clickable');
    }
    await this.page.clickContentShareButton();
    const message = this.testType === "ON" ? 'content_share_start' : 'content_share_stop';
    this.finished(message)
  }
}

module.exports = ClickContentShareButton;
