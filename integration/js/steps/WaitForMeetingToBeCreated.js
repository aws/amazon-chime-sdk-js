const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForMeetingToBeCreated extends AppWaitTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new WaitForMeetingToBeCreated(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for meeting to be created';
  }

  waitCompleteCondition() {
    return this.test.meetingCreated === true
  }

  waitCompleteMessage() {
    console.log("Meeting created");
  }
}

module.exports = WaitForMeetingToBeCreated;
