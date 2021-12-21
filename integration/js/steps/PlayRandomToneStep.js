const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class PlayRandomToneStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, playStereoTones) {
    super(kiteBaseTest, sessionInfo);
    this.playStereoTones = playStereoTones;
  }

  static async executeStep(KiteBaseTest, sessionInfo, playStereoTones = false) {
    const step = new PlayRandomToneStep(KiteBaseTest, sessionInfo, playStereoTones);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return `Start playing random ${this.playStereoTones ? 'stereo' : 'mono'} tone`;
  }

  metricName() {
    return `PlayRandomToneStep${this.playStereoTones ? 'Stereo': ''}`
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    if (this.playStereoTones) {
      await this.page.playRandomStereoTone();
    } else {
      await this.page.playRandomTone();
    }
    this.finished("audio_start");
  }
}

module.exports = PlayRandomToneStep;
