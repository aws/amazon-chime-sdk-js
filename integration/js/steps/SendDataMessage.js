const AppTestStep = require('../utils/AppTestStep');

class SendDataMessage extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, message) {
    super(kiteBaseTest, sessionInfo);
    this.message = message;
  }

  static async executeStep(KiteBaseTest, sessionInfo, message) {
    const step = new SendDataMessage(KiteBaseTest, sessionInfo, message);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Send a data message: ' + this.message;
  }

  async run() {
    await this.page.sendDataMessage(this.message);
  }
}

module.exports = SendDataMessage;
