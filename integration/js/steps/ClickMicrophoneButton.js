const AppTestStep = require('../utils/AppTestStep');

class ClickMicrophoneButton extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new ClickMicrophoneButton(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Click microphone button';
  }

  async run() {
    await this.page.clickMicrophoneButton();
    const message = this.testType === "ON" ? 'audio_start' : 'audio_stop';
    this.finished(message)
  }
}

module.exports = ClickMicrophoneButton;
