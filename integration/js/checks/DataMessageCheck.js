const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class DataMessageCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, message) {
    super(kiteBaseTest, sessionInfo);
    this.message = message;
  }

  static async executeStep(KiteBaseTest, sessionInfo, message) {
    const step = new DataMessageCheck(KiteBaseTest, sessionInfo, message);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check data message: ' + this.message;
  }

  async run() {
    try {
      const result = await this.page.checkDataMessageExist(this.message);
      if (!result) {
        this.testReporter.textAttachment(this.report, 'Data message', result, 'plain');
        throw new KiteTestError(Status.FAILED, `Message ${this.message} not found`);
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

module.exports = DataMessageCheck;
