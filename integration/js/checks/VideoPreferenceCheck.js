const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class VideoPreferenceCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, attendeeId, priority, targetSize) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
    this.priority = priority;
    this.targetSize = targetSize;
  }

  static async executeStep(KiteBaseTest, sessionInfo, tileStateElementId, tileStateAttribute, tileStateValue) {
    const step = new VideoPreferenceCheck(KiteBaseTest, sessionInfo, tileStateElementId, tileStateAttribute, tileStateValue);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check tileState';
  }

  async run() {
      const tileStateCheckPassed = await this.page.videoPreferenceCheck(this.tileStateElementId, this.tileStateAttribute, this.tileStateValue);
      if (!tileStateCheckPassed) {
        throw new KiteTestError(Status.FAILED, `TileState ${this.tileStateAttribute} was not correct`);
      }
  }
}

module.exports = VideoPreferenceCheck;
