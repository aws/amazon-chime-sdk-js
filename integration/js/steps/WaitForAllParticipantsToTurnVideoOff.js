const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForAllParticipantsToTurnVideoOff extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo, remoteParticipantCount) {
    super(kiteBaseTest, sessionInfo);
    this.remoteParticipantCount = remoteParticipantCount;
  }

  static async executeStep(KiteBaseTest, sessionInfo, remoteParticipantCount) {
    const step = new WaitForAllParticipantsToTurnVideoOff(KiteBaseTest, sessionInfo, remoteParticipantCount);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to turn off their videos';
  }

  waitCompleteCondition() {
    return this.test.numVideoRemoteOff.toString() === this.remoteParticipantCount;
  }

  waitCompleteMessage() {
    return "all remote participants turned off video"
  }

}

module.exports = WaitForAllParticipantsToTurnVideoOff;
