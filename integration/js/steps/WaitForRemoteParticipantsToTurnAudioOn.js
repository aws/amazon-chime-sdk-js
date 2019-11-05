const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteParticipantsToTurnAudioOn extends AppWaitTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new WaitForRemoteParticipantsToTurnAudioOn(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to turn on their audio';
  }

  waitCompleteCondition() {
    return this.test.numRemoteAudioOn.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    return "all remote participants turned on audio"
  }

}

module.exports = WaitForRemoteParticipantsToTurnAudioOn;
