const AppTestStep = require('../utils/AppTestStep');

class LeaveMeetingStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new LeaveMeetingStep(KiteBaseTest, sessionInfo);
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
