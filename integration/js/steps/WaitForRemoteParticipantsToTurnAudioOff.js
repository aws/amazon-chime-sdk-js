const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteParticipantsToTurnAudioOff extends AppWaitTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new WaitForRemoteParticipantsToTurnAudioOff(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to turn off their audio';
  }

  waitCompleteCondition() {
    return this.test.numRemoteAudioOff.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    return "all remote participants turned off audio"
  }

}

module.exports = WaitForRemoteParticipantsToTurnAudioOff;
