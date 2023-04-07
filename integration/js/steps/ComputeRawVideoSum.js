const AppTestStep = require('../utils/AppTestStep');

class ComputeRawVideoSum extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendeeId, rawVideoSumSingleton) {
    super(kiteBaseTest, sessionInfo);
    this.attendeeId = attendeeId;
    // Need a singleton array as returning the sum directory from this class isn't possible
    // without changing the implementation of TestStep in kite-common
    this.rawVideoSumSingleton = rawVideoSumSingleton;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendeeId, rawVideoSumSingleton) {
    const step = new ComputeRawVideoSum(KiteBaseTest, sessionInfo, attendeeId, rawVideoSumSingleton);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Compute raw video sum';
  }

  async run() {
    this.rawVideoSumSingleton[0] =  await this.page.computeVideoSum(this.attendeeId);
  }
}

module.exports = ComputeRawVideoSum;
