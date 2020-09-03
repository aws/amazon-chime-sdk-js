const {KiteTestError, Status} = require('kite-common');
const { v4: uuidv4 } = require('uuid');
const AppTestStep = require('../utils/AppTestStep');

class OpenMeetingReadinessCheckerAppStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new OpenMeetingReadinessCheckerAppStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Open meeting readiness checker app';
  }

  async run() {
    this.logger(`Opening : ${this.url}`);
    await this.page.open(this);
  }
}

module.exports = OpenMeetingReadinessCheckerAppStep;
