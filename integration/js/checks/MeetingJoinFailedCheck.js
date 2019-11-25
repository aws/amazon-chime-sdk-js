const {KiteTestError, Status} = require('kite-common');
const demo = require('../pages/AppPage');
const AppTestStep = require('../utils/AppTestStep');

class MeetingJoinFailedCheck extends AppTestStep {
  constructor(kiteBaseTest, attendee_id) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest, attendee_id) {
    const step = new MeetingJoinFailedCheck(KiteBaseTest, attendee_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if user failed to join the meeting';
  }

  metricName() {
    return 'JoinEndedMeetingCheck'
  }

  async run() {
    let failed = await this.page.checkIfFailedToJoinMeeting();
    if (failed === false) {
      throw new KiteTestError(Status.FAILED, 'User was able to join the meeting');
    }
  }
}

module.exports = MeetingJoinFailedCheck;
