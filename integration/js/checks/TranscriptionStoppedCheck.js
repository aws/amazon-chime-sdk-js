const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class TranscriptionStoppedCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, useMedical) {
    super(kiteBaseTest, sessionInfo);
    this.useMedical = useMedical;
  }

  static async executeStep(KiteBaseTest, sessionInfo, useMedical) {
    const step = new TranscriptionStoppedCheck(KiteBaseTest, sessionInfo, useMedical);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if transcription was stopped';
  }

  metricName() {
    return 'TranscriptionStoppedCheck'
  }

  async run() {
    if (await this.page.isLiveTranscriptionEnabledInDeviceMenu()) {
      throw new KiteTestError(Status.FAILED, 'Live Transcription still selected in menu');
    }
    if (!await this.page.checkIfTranscriptionVisible()) {
      throw new KiteTestError(Status.FAILED, 'Transcript container UI is not visible on page');
    }
    if (!await this.page.checkIfTranscriptionStopped(this.useMedical)) {
      throw new KiteTestError(Status.FAILED, 'Transcription was not stopped');
    }
  }
}

module.exports = TranscriptionStoppedCheck;
