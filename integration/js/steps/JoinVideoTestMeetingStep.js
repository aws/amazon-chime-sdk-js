const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class JoinVideoTestMeetingStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, meeting_title, useSimulcastFlag = false, useWebAudioFlag = false) {
    super(kiteBaseTest, sessionInfo);
    this.meeting_title = meeting_title;
    this.useSimulcastFlag = useSimulcastFlag;
    this.useWebAudioFlag = useWebAudioFlag;
  }

  static async executeStep(KiteBaseTest, sessionInfo, meeting_title, useSimulcastFlag) {
    const step = new JoinVideoTestMeetingStep(KiteBaseTest, sessionInfo, meeting_title, useSimulcastFlag);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'User join the video test app meeting';
  }

  metricName() {
    return 'JoinVideoTestMeetingStep'
  }

  async run() {
    await this.page.enterAttendeeName();
    if (this.useSimulcastFlag) {
      this.logger("choose to use simulcast");
      await this.page.chooseUseSimulcast();
    }
    if (this.useWebAudioFlag) {
      this.logger("choose to use Web Audio");
      await this.page.chooseUseWebAudio();
    }
    this.logger("meeting title: " + this.meeting_title);
    await this.page.enterMeetingTitle(this.meeting_title);
    this.logger("waiting to authenticate");
    this.test.numRemoteJoined =  this.numberOfParticipant ;
    let authenticationState = await this.page.waitForAuthentication();
    if (authenticationState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Authentication timeout');
    }
  }
}

module.exports = JoinVideoTestMeetingStep;
