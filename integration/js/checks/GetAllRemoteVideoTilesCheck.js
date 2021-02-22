const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class GetAllRemoteVideoTilesCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, totalRemoteVideoTilesCount) {
    super(kiteBaseTest, sessionInfo);
    this.totalRemoteVideoTilesCount = totalRemoteVideoTilesCount;
  }

  static async executeStep(KiteBaseTest, sessionInfo, totalRemoteVideoTilesCount) {
    const step = new GetAllRemoteVideoTilesCheck(KiteBaseTest, sessionInfo, totalRemoteVideoTilesCount);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check Total Remote Video Tiles Count of GetAllRemoteVideoTiles';
  }

  async run() {
      const getAllRemoteVideoTilesCheckPassed = await this.page.getAllRemoteVideoTilesCheck(this.totalRemoteVideoTilesCount);
      if (!getAllRemoteVideoTilesCheckPassed) {
        throw new KiteTestError(Status.FAILED, `TotalRemoteVideoTilesCount ${this.totalRemoteVideoTilesCount} was not correct`);
      }
  }
}

module.exports = GetAllRemoteVideoTilesCheck;
