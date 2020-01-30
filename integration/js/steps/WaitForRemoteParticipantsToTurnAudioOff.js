const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteParticipantsToTurnAudioOff extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new WaitForRemoteParticipantsToTurnAudioOff(KiteBaseTest, sessionInfo);
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
