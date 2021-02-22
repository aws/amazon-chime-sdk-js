const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class GetLocalVideoTileCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, tileId) {
    super(kiteBaseTest, sessionInfo);
    this.tileId = tileId;
  }

  static async executeStep(KiteBaseTest, sessionInfo, tileId) {
    const step = new GetLocalVideoTileCheck(KiteBaseTest, sessionInfo, tileId);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check tileId from tileState of GetLocalVideoTile call';
  }

  async run() {
      const getLocalVideoTileCheckPassed = await this.page.getLocalVideoTileCheck(this.tileId);
      if (!getLocalVideoTileCheckPassed) {
        throw new KiteTestError(Status.FAILED, `TileId ${this.tileId} was not correct`);
      }
  }
}

module.exports = GetLocalVideoTileCheck;
