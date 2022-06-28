const AppTestStep = require('../utils/AppTestStep');

class StartMeetingTranscriptionStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, useMedical) {
    super(kiteBaseTest, sessionInfo);
    this.useMedical = useMedical;
  }

  static async executeStep(KiteBaseTest, sessionInfo, useMedical) {
    const step = new StartMeetingTranscriptionStep(KiteBaseTest, sessionInfo, useMedical);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start transcription for the meeting';
  }

  metricName() {
    return 'StartMeetingTranscriptionStep';
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    if (!await this.page.isLiveTranscriptionPresentInDeviceMenu()) {
      throw new Error('Live Transcription not present in menu');
    }

    await this.page.clickLiveTranscriptionMenuButton();
    if (!this.useMedical) {
      await this.page.clickTranscribeEngineOption();
    } else {
      await this.page.clickTranscribeMedicalEngineOption();
    }
    await this.page.clickStartTranscriptionButton();

    this.finished('transcription_started');
  }
}

module.exports = StartMeetingTranscriptionStep;
