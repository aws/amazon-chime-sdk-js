const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class HaveVideoTilesWithStreamsCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, haveVideoTilesWithStreamsBoolean) {
    super(kiteBaseTest, sessionInfo);
    this.haveVideoTilesWithStreamsBoolean = haveVideoTilesWithStreamsBoolean;
  }

  static async executeStep(KiteBaseTest, sessionInfo, haveVideoTilesWithStreamsBoolean) {
    const step = new HaveVideoTilesWithStreamsCheck(KiteBaseTest, sessionInfo, haveVideoTilesWithStreamsBoolean);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check boolean value of HaveVideoTilesWithStreams';
  }

  async run() {
      const haveVideoTilesWithStreamsCheckPassed = await this.page.elementBooleanCheck(this.haveVideoTilesWithStreamsBoolean, 'haveVideoTilesWithStreamsElementId');
      if (!haveVideoTilesWithStreamsCheckPassed) {
        throw new KiteTestError(Status.FAILED, `HaveVideoTilesWithStreamsBoolean ${this.haveVideoTilesWithStreamsBoolean} was not correct`);
      }
  }
}

module.exports = HaveVideoTilesWithStreamsCheck;
