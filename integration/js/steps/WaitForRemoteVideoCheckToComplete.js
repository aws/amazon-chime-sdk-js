const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteVideoCheckToComplete extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForRemoteVideoCheckToComplete(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to complete their video checks';
  }

  waitCompleteCondition() {
    return this.test.numOfParticipantsCompletedVideoCheck.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    return "all remote participants completed video check"
  }

  onThresholdBreach() {
    throw new KiteTestError(Status.FAILED, 'Timeout ' + this.stepDescription());
  }
}

module.exports = WaitForRemoteVideoCheckToComplete;
