const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class GetAllVideoTilesCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, totalVideoTilesCount) {
    super(kiteBaseTest, sessionInfo);
    this.totalVideoTilesCount = totalVideoTilesCount;
  }

  static async executeStep(KiteBaseTest, sessionInfo, totalVideoTilesCount) {
    const step = new GetAllVideoTilesCheck(KiteBaseTest, sessionInfo, totalVideoTilesCount);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check total video tiles counts for GetAllVideoTiles';
  }

  async run() {
      const getAllVideoTilesCheckPassed = await this.page.getAllVideoTilesCheck(this.totalVideoTilesCount);
      if (!getAllVideoTilesCheckPassed) {
        throw new KiteTestError(Status.FAILED, `TotalVideoTilesCount ${this.totalVideoTilesCount} was not correct`);
      }
  }
}

module.exports = GetAllVideoTilesCheck;
