const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('./AppTestStep');

class AppWaitTestStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  waitCompleteCondition() {
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
      if (this.waitCompleteCondition()) {
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

module.exports = AppWaitTestStep;
