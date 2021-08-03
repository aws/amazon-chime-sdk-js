const AppTestStep = require('../utils/AppTestStep');

class StopMeetingTranscriptionStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new StopMeetingTranscriptionStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Stop transcription for the meeting';
  }

  metricName() {
    return 'StopMeetingTranscriptionStep';
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    if (!await this.page.isLiveTranscriptionEnabledInDeviceMenu()) {
      throw new Error('Live Transcription is not already enabled in device menu');
    }

    await this.page.clickLiveTranscriptionMenuButton();

    this.finished('transcription_stopped');
  }
}

module.exports = StopMeetingTranscriptionStep;
