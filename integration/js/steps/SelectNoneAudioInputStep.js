const AppTestStep = require('../utils/AppTestStep');

class SelectNoneAudioInputStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo, useMedical) {
    const step = new SelectNoneAudioInputStep(KiteBaseTest, sessionInfo, useMedical);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Select None in the microphone dropdown menu';
  }

  metricName() {
    return 'SelectNoneAudioInputStep';
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    await this.page.selectNoneAudioInput();
    this.finished("audio_none_start");
  }
}

module.exports = SelectNoneAudioInputStep;
