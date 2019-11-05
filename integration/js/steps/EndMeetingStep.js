const AppTestStep = require('../utils/AppTestStep');

class EndMeetingStep extends AppTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new EndMeetingStep(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'End the meeting';
  }

  async run() {
    await this.page.endTheMeeting();
  }
}

module.exports = EndMeetingStep;
