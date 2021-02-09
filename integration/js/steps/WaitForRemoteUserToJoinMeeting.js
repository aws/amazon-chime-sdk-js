const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForRemoteUserToJoinMeeting extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo, numberOfParticipant) {
    super(kiteBaseTest, sessionInfo);
    this.numberOfParticipant = numberOfParticipant;
  }

  static async executeStep(KiteBaseTest, sessionInfo, numberOfParticipant) {
    const step = new WaitForRemoteUserToJoinMeeting(KiteBaseTest, sessionInfo, numberOfParticipant);
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

module.exports = WaitForRemoteUserToJoinMeeting;
