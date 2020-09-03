const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('./AppTestStep');

class AsyncAppWaitTestStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  async waitCompleteCondition() {
  }

  waitCompleteMessage() {
  }

  timeoutThresholdInMilliSeconds() {
    return 30000
  }

  onThresholdBreach() {
    this.logger("Timout " + this.stepDescription());
  }

  async run() {
    let i = 0;
    let waitTime = 100;
    while (i < this.timeoutThresholdInMilliSeconds() / waitTime) {
      i++;
      if (await this.waitCompleteCondition()) {
        if (this.waitCompleteMessage()){
          this.logger(this.waitCompleteMessage());
        }
        return;
      }
      await TestUtils.waitAround(waitTime);
    }
    this.onThresholdBreach();
  }
}

module.exports = AsyncAppWaitTestStep;
