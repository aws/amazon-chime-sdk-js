const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class TranscriptionStartedCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, useMedical) {
    super(kiteBaseTest, sessionInfo);
    this.useMedical = useMedical;
  }

  static async executeStep(KiteBaseTest, sessionInfo, useMedical) {
    const step = new TranscriptionStartedCheck(KiteBaseTest, sessionInfo, useMedical);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if transcription was started';
  }

  metricName() {
    return 'TranscriptionStartedCheck'
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton(); // open dropdown
    if (!await this.page.isLiveTranscriptionEnabledInDeviceMenu()) {
      throw new KiteTestError(Status.FAILED, 'Live Transcription not selected in menu');
    }
    await this.page.clickOnMicrophoneDropDownButton(); // close dropdown
    if (!await this.page.checkIfTranscriptionVisible()) {
      throw new KiteTestError(Status.FAILED, 'Transcript container UI is not visible on page');
    }
    if (!await this.page.checkIfTranscriptionStarted(this.useMedical)) {
      throw new KiteTestError(Status.FAILED, 'Transcription was not started');
    }
  }
}

module.exports = TranscriptionStartedCheck;
