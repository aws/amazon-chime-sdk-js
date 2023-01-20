const {KiteTestError, Status} = require('kite-common');
const { v4: uuidv4 } = require('uuid');
const AppTestStep = require('../utils/AppTestStep');

class JoinMeetingStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, skipWait) {
    super(kiteBaseTest, sessionInfo);
    this.skipWait = skipWait;
  }

  static async executeStep(KiteBaseTest, sessionInfo, skipWait = false) {
    const step = new JoinMeetingStep(KiteBaseTest, sessionInfo, skipWait);
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
    if (this.skipWait) {
      return;
    }
    let joinState = await this.page.waitToJoinTheMeeting();
    if (joinState === 'failed') {
      throw new KiteTestError(Status.BROKEN, 'Timeout while joining the meeting');
    }
    await this.page.logMeetingId();
  }
}

module.exports = JoinMeetingStep;
