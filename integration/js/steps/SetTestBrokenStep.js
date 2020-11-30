const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class SetTestBrokenStep extends AppTestStep {
  constructor(kiteBaseTest, errorMessage) {
    super(kiteBaseTest);
    this.errorMessage = errorMessage;
  }

  stepDescription() {
    return 'Setting test to broken';
  }

  static async executeStep(KiteBaseTest, errorMessage) {
    const step = new SetTestBrokenStep(KiteBaseTest, errorMessage);
    await step.execute(KiteBaseTest);
  }

  async step() {
    throw new KiteTestError(Status.BROKEN, this.errorMessage);
  }

  async finish() {
    this.report.setName(this.stepDescription());
    this.report.setDescription(this.stepDescription());
    this.report.setStopTimestamp();
  }
}

module.exports = SetTestBrokenStep;
