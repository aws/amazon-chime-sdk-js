const {KiteTestError, Status} = require('kite-common');
const { v4: uuidv4 } = require('uuid');
const AppTestStep = require('../utils/AppTestStep');

class JoinMeetingStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new JoinMeetingStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'User join the meeting';
  }

  metricName() {
    return 'JoinMeetingStep'
  }

  emitMetricToCommonNamespace() {
    return true
  }

  async run() {
    await this.page.joinMeeting();
    let joinState = await this.page.waitToJoinTheMeeting();
    if (joinState === 'failed') {
      throw new KiteTestError(Status.BROKEN, 'Timeout while joining the meeting');
    }
  }
}

module.exports = JoinMeetingStep;
