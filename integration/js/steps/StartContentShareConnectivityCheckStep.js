const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class StartContentShareConnectivityCheckStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new StartContentShareConnectivityCheckStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Start content Share connectivity check';
  }

  metricName() {
    return 'StartContentShareConnectivityCheck'
  }

  async run() {
    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    };

    await this.page.startContentShareConnectivityCheck();
    await sleep(10000);
  }
}

module.exports = StartContentShareConnectivityCheckStep;
