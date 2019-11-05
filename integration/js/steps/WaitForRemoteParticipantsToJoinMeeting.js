const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteParticipantsToJoinMeeting extends AppWaitTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new WaitForRemoteParticipantsToJoinMeeting(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for other participants to join the meeting';
  }

  waitCompleteCondition() {
    return this.test.numRemoteJoined.toString() === this.numberOfParticipant
  }

  waitCompleteMessage() {
    return "all remote participants present"
  }

}

module.exports = WaitForRemoteParticipantsToJoinMeeting;
