const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class AddVideoTileCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, tileId) {
    super(kiteBaseTest, sessionInfo);
    this.tileId = tileId;
  }

  static async executeStep(KiteBaseTest, sessionInfo, tileId) {
    const step = new AddVideoTileCheck(KiteBaseTest, sessionInfo, tileId);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check tileId returned by AddVideoTile';
  }

  async run() {
      const addVideoTileCheckPassed = await this.page.addVideoTileCheck(this.tileId);
      if (!addVideoTileCheckPassed) {
        throw new KiteTestError(Status.FAILED, `TileId ${this.tileId} was not correct`);
      }
  }
}

module.exports = AddVideoTileCheck;
