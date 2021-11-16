const AppTestStep = require('../utils/AppTestStep');

class PlayEchoStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new PlayEchoStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start Echo Effect';
  }

  metricName() {
    return 'PlayEchoStep';
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    await this.page.playEcho();
    this.finished("echo_start");
  }
}

module.exports = PlayEchoStep;
