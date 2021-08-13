const AppTestStep = require('../utils/AppTestStep');

class PlayPrerecordedSpeechStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo, useMedical) {
    const step = new PlayPrerecordedSpeechStep(KiteBaseTest, sessionInfo, useMedical);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start playing prerecorded speech from microphone dropdown menu';
  }

  metricName() {
    return 'PlayPrerecordedSpeechStep';
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    await this.page.playPrerecordedSpeech();
    this.finished("prerecorded_speech_start");
  }
}

module.exports = PlayPrerecordedSpeechStep;
