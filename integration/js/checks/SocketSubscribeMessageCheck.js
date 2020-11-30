const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class SocketSubscribeMessageCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, messageType) {
    super(kiteBaseTest, sessionInfo);
    this.messageType = messageType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, messageType) {
    const step = new SocketSubscribeMessageCheck(KiteBaseTest, sessionInfo, messageType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check for message type: ' + this.messageType;
  }

  async run() {
    try {
      const result = await this.page.checkMessageTypeExist(this.messageType);
      if (!result) {
        this.testReporter.textAttachment(this.report, 'Messaging session', result, 'plain');
        throw new KiteTestError(Status.FAILED, `Message type ${this.message} not found`);
      }
    } catch (error) {
      this.logger(error);
      if (error instanceof KiteTestError) {
        throw error;
      } else {
        throw new KiteTestError(Status.BROKEN, 'Error looking for data message');
      }
    }
  }
}

module.exports = SocketSubscribeMessageCheck;
