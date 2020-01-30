const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class EndMeetingStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new EndMeetingStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'End the meeting';
  }

  async run() {
    await this.page.endTheMeeting();
    this.logger("waiting for meeting to end");
    try {
      let meetingEndState = await this.page.waitingToEndMeeting();
      if (meetingEndState === 'failed') {
        throw new KiteTestError(Status.FAILED, 'Meeting end timeout');
      }
    } catch (e) {
      this.logger(`${e}`);
      throw new KiteTestError(Status.FAILED, 'Meeting end failed');
    }
  }
}

module.exports = EndMeetingStep;
