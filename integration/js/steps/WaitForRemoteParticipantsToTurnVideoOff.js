const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteParticipantsToTurnVideoOff extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForRemoteParticipantsToTurnVideoOff(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to turn off their videos';
  }

  waitCompleteCondition() {
    return this.test.numVideoRemoteOff.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    return "all remote participants turned off video"
  }

}

module.exports = WaitForRemoteParticipantsToTurnVideoOff;
