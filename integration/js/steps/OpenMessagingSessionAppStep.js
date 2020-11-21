const AppTestStep = require('../utils/AppTestStep');

class OpenMessagingSessionAppStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new OpenMessagingSessionAppStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Open messaging session app';
  }

  async run() {
    this.logger(`Opening : ${this.url}`);
    await this.page.open(this);
  }
}

module.exports = OpenMessagingSessionAppStep;
