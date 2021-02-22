const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class GetBoundAttendeeIdStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new GetBoundAttendeeIdStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'get boundAttendeeId Step';
  }

  metricName() {
    return 'GetBoundAttendeeId'
  }

  async run() {
    let boundAttendeeId = await this.page.getBoundAttendeeIdStep();
    this.test.boundAttendeeId = boundAttendeeId;
  }
}

module.exports = GetBoundAttendeeIdStep;
