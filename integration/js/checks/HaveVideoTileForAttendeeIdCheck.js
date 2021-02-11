const AppTestStep = require('../utils/AppTestStep');
const {KiteTestError, Status} = require('kite-common');

class HaveVideoTileForAttendeeIdCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, haveVideoTileForAttendeeIdBoolean) {
    super(kiteBaseTest, sessionInfo);
    this.haveVideoTileForAttendeeIdBoolean = haveVideoTileForAttendeeIdBoolean;
  }

  static async executeStep(KiteBaseTest, sessionInfo, haveVideoTileForAttendeeIdBoolean) {
    const step = new HaveVideoTileForAttendeeIdCheck(KiteBaseTest, sessionInfo, haveVideoTileForAttendeeIdBoolean);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check boolean value of HaveVideoTileForAttendeeId';
  }

  async run() {
      const haveVideoTileForAttendeeIdCheckPassed = await this.page.elementBooleanCheck(this.haveVideoTileForAttendeeIdBoolean, 'haveVideoTileForAttendeeIdElementId');
      if (!haveVideoTileForAttendeeIdCheckPassed) {
        throw new KiteTestError(Status.FAILED, `HaveVideoTileForAttendeeIdBoolean ${this.haveVideoTileForAttendeeIdBoolean} was not correct`);
      }
  }
}

module.exports = HaveVideoTileForAttendeeIdCheck;
