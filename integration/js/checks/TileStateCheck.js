const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class TileStateCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, tileStateElementId, tileStateAttribute, tileStateValue) {
    super(kiteBaseTest, sessionInfo);
    this.tileStateElementId = tileStateElementId;
    this.tileStateAttribute = tileStateAttribute;
    this.tileStateValue = tileStateValue;
  }

  static async executeStep(KiteBaseTest, sessionInfo, tileStateElementId, tileStateAttribute, tileStateValue) {
    const step = new TileStateCheck(KiteBaseTest, sessionInfo, tileStateElementId, tileStateAttribute, tileStateValue);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check tileState';
  }

  async run() {
      const tileStateCheckPassed = await this.page.tileStateCheck(this.tileStateElementId, this.tileStateAttribute, this.tileStateValue);
      if (!tileStateCheckPassed) {
        throw new KiteTestError(Status.FAILED, `TileState ${this.tileStateAttribute} was not correct`);
      }
  }
}

module.exports = TileStateCheck;
