const {KiteTestError, Status} = require('kite-common');
const demo = require('../pages/AppPage');
const AppTestStep = require('../utils/AppTestStep');

class UserJoinedMeetingCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendee_id) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendee_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendee_id) {
    const step = new UserJoinedMeetingCheck(KiteBaseTest, sessionInfo, attendee_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if the user has joined the meeting';
  }

  metricName() {
    return 'UserMeetingJoinCheck'
  }

  async run() {
    let joined = await this.page.checkIfUserJoinedTheMeeting();
    if (joined === false) {
      throw new KiteTestError(Status.FAILED, 'User unable to join the meeting');
    }
    this.finished("attendee_joined", this.attendeeId);
  }
}

module.exports = UserJoinedMeetingCheck;
