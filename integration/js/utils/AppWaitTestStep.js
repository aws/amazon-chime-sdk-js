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

  timeoutThreshold() {
    return 20000
  }

  onThresholdBreach() {
    console.log("Timout " + this.stepDescription());
  }

  async run() {
    let i = 0;
    while (i < this.timeoutThreshold()) {
      i++;
      if (this.waitCompleteCondition()) {
        console.log(this.waitCompleteMessage());
        return;
      }
      await TestUtils.waitAround(1);
    }
    this.onThresholdBreach();
  }
}

module.exports = AppWaitTestStep;
