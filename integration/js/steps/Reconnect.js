const AppTestStep = require('../utils/AppTestStep');

class Reconnect extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new Reconnect(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Trigger reconnection';
  }

  async run() {
    await this.page.triggerReconnection();
  }
}

module.exports = Reconnect;
