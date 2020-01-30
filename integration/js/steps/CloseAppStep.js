const AppTestStep = require('../utils/AppTestStep');

class CloseAppStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new CloseAppStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Close app';
  }

  async run() {
    this.logger(`Closing : ${this.url}`);
    await this.page.close(this);
  }
}

module.exports = CloseAppStep;
