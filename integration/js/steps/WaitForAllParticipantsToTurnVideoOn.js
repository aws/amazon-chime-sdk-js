const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForAllParticipantsToTurnVideoOn extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo, remoteParticipantCount) {
    super(kiteBaseTest, sessionInfo);
    this.remoteParticipantCount = remoteParticipantCount;
  }

  static async executeStep(KiteBaseTest, sessionInfo, remoteParticipantCount) {
    const step = new WaitForAllParticipantsToTurnVideoOn(KiteBaseTest, sessionInfo, remoteParticipantCount);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for all participants to turn on their audio';
  }

  waitCompleteCondition() {
    return this.test.numVideoRemoteOn.toString() === this.remoteParticipantCount
  }

  waitCompleteMessage() {
    return "all all participants turned on audio"
  }

}

module.exports = WaitForAllParticipantsToTurnVideoOn;
