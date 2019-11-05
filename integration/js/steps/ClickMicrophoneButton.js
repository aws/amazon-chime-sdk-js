const AppTestStep = require('../utils/AppTestStep');

class ClickMicrophoneButton extends AppTestStep {
  constructor(kiteBaseTest, testType) {
    super(kiteBaseTest);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, testType) {
    const step = new ClickMicrophoneButton(KiteBaseTest, testType);
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
