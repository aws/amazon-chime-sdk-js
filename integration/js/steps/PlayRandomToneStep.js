const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class PlayRandomToneStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendee_id) {
    super(kiteBaseTest, sessionInfo);
    this.attendee_id = attendee_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new PlayRandomToneStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start playing random tone';
  }

  metricName() {
    return 'PlayRandomToneStep'
  }

  async run() {
    await this.page.clickOnMicrophoneDropDownButton();
    await this.page.playRandomTone();
    this.finished("audio_start");
  }
}

module.exports = PlayRandomToneStep;
