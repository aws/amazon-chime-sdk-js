const AppWaitTestStep = require('../utils/AppWaitTestStep');

class WaitForAllParticipantsToJoinMeeting extends AppWaitTestStep {
  constructor(kiteBaseTest, sessionInfo, participantCount) {
    super(kiteBaseTest, sessionInfo);
    this.participantCount = participantCount;
  }

  static async executeStep(KiteBaseTest, sessionInfo, participantCount) {
    const step = new WaitForAllParticipantsToJoinMeeting(KiteBaseTest, sessionInfo, participantCount);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Waiting for all participants to join the meeting';
  }

  waitCompleteCondition() {
    return this.numberOfParticipant.toString() === this.participantCount;
  }

  waitCompleteMessage() {
    return "all participants present including remote participants"
  }

}

module.exports = WaitForAllParticipantsToJoinMeeting;
