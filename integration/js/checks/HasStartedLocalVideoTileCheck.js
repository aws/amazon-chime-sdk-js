const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class HasStartedLocalVideoTileCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, hasStartedLocalVideoTileBoolean) {
    super(kiteBaseTest, sessionInfo);
    this.hasStartedLocalVideoTileBoolean = hasStartedLocalVideoTileBoolean;
  }

  static async executeStep(KiteBaseTest, sessionInfo, hasStartedLocalVideoTileBoolean) {
    const step = new HasStartedLocalVideoTileCheck(KiteBaseTest, sessionInfo, hasStartedLocalVideoTileBoolean);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check boolean value of HasStartedLocalVideoTile';
  }

  async run() {
      const hasStartedLocalVideoTileCheckPassed = await this.page.elementBooleanCheck(this.hasStartedLocalVideoTileBoolean, 'hasStartedLocalVideoTileElementId');
      if (!hasStartedLocalVideoTileCheckPassed) {
        throw new KiteTestError(Status.FAILED, `HasStartedLocalVideoTileBoolean ${this.hasStartedLocalVideoTileBoolean} was not correct`);
      }
  }
}

module.exports = HasStartedLocalVideoTileCheck;
