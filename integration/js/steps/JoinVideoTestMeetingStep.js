const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class JoinVideoTestMeetingStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendee_id, meeting_title, useSimulcastFlag = false, useWebAudioFlag = false) {
    super(kiteBaseTest, sessionInfo);
    this.attendee_id = attendee_id;
    this.meeting_title = meeting_title;
    this.useSimulcastFlag = useSimulcastFlag;
    this.useWebAudioFlag = useWebAudioFlag;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendee_id, meeting_title, useSimulcastFlag) {
    const step = new JoinVideoTestMeetingStep(KiteBaseTest, sessionInfo, attendee_id, meeting_title, useSimulcastFlag);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'User join the video test app meeting';
  }

  metricName() {
    return 'JoinVideoTestMeetingStep'
  }

  async run() {
    this.logger("attendee id: " + this.attendee_id);
    await this.page.enterAttendeeName(this.attendee_id);
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
    let authenticationState = await this.page.waitForAuthentication();
    if (authenticationState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Authentication timeout');
    }
  }
}

module.exports = JoinVideoTestMeetingStep;
