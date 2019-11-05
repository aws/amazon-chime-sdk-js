const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteParticipantsToTurnVideoOn extends AppWaitTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new WaitForRemoteParticipantsToTurnVideoOn(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to turn on their videos';
  }

  waitCompleteCondition() {
    return this.test.numVideoRemoteOn.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    return "all remote participants turned on video"
  }

}

module.exports = WaitForRemoteParticipantsToTurnVideoOn;
