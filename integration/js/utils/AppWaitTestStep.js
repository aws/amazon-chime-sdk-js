const {KiteTestError, Status, TestUtils} = require('kite-common');
const AppTestStep = require('./AppTestStep');

class AppWaitTestStep extends AppTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  waitCompleteCondition() {
  }

  waitCompleteMessage() {
  }

  timeoutThresholdInMilliSeconds() {
    return 30000
  }

  onThresholdBreach() {
    console.log("Timout " + this.stepDescription());
  }

  async run() {
    let i = 0;
    let waitTime = 100;
    while (i < this.timeoutThresholdInMilliSeconds() / waitTime) {
      i++;
      if (this.waitCompleteCondition()) {
        console.log(this.waitCompleteMessage());
        return;
      }
      await TestUtils.waitAround(waitTime);
    }
    this.onThresholdBreach();
  }
}

module.exports = AppWaitTestStep;
