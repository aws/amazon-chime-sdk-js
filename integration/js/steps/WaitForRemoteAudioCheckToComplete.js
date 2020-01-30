const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteAudioCheckToComplete extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForRemoteAudioCheckToComplete(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to complete their audio checks';
  }

  waitCompleteCondition() {
    return this.test.numOfParticipantsCompletedAudioCheck.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    this.test.numOfParticipantsCompletedAudioCheck = 1;
    return "all remote participants completed audio check"
  }

  onThresholdBreach() {
    throw new KiteTestError(Status.FAILED, 'Timeout ' + this.stepDescription());
  }
}

module.exports = WaitForRemoteAudioCheckToComplete;
