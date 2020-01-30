const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForMeetingToBeCreated extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForMeetingToBeCreated(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for meeting to be created';
  }

  waitCompleteCondition() {
    return this.test.meetingCreated === true
  }

  waitCompleteMessage() {
    this.logger("Meeting created");
  }
}

module.exports = WaitForMeetingToBeCreated;
