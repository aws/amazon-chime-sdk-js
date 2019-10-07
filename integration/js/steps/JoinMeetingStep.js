const {KiteTestError, Status} = require('kite-common');
const uuidv4 = require('uuid/v4');
const AppTestStep = require('../utils/AppTestStep');

class JoinMeetingStep extends AppTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new JoinMeetingStep(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'User join the meeting';
  }

  metricName() {
    return 'JoinMeetingStep'
  }

  async run() {
    await this.page.joinMeeting();
    let joinState = await this.page.waitToJoinTheMeeting();
    if (joinState === 'failed') {
      throw new KiteTestError(Status.ERROR, 'Timeout while joining the meeting');
    }
  }
}

module.exports = JoinMeetingStep;
