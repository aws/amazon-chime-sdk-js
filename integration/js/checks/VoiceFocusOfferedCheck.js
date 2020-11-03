const {TestStep, KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class VoiceFocusOfferedCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, testType) {
    super(kiteBaseTest, sessionInfo);
    this.testType = testType;
  }

  static async executeStep(KiteBaseTest, sessionInfo, testType) {
    const step = new VoiceFocusOfferedCheck(KiteBaseTest, sessionInfo, testType);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check that Amazon Voice Focus was offered';
  }

  metricName() {
    return `VoiceFocus${this.testType === 'OFFERED' ? 'Offered' : 'NotOffered'}Check`
  }

  async run() {
    // We need to wait a reasonable amount of time to make sure the checkbox doesn't magically
    // appear, or wait for it to do so.
    const should = this.testType === 'OFFERED';
    const passed = await this.page.isVoiceFocusCheckboxVisible(should);
    if (!passed) {
      throw new KiteTestError(Status.FAILED, 'Voice Focus offered check failed');
    }
    this.finished("voice_focus_offered_check_complete");
  }
}

module.exports = VoiceFocusOfferedCheck;
