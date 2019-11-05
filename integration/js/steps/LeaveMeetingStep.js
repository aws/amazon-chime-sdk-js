const AppTestStep = require('../utils/AppTestStep');

class LeaveMeetingStep extends AppTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new LeaveMeetingStep(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Leave the meeting';
  }

  async run() {
    await this.page.leaveTheMeeting();
  }
}

module.exports = LeaveMeetingStep;
