const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class ConnectMessagingSessionStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, userArn) {
    super(kiteBaseTest, sessionInfo);
    this.userArn = userArn;
  }

  static async executeStep(KiteBaseTest, sessionInfo, userArn) {
    const step = new ConnectMessagingSessionStep(KiteBaseTest, sessionInfo, userArn);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Connecting messaging session';
  }

  metricName() {
    return 'ConnectMessagingSessionStep'
  }

  async run() {
    if (!this.userArn) {
      throw new KiteTestError(Status.FAILED, 'Invalid userArn');
    }
    await this.page.enterUserArn(this.userArn);
    await this.page.connect();
    this.logger("Waiting to connection");
    let connectionState = await this.page.waitForConnection();
    if (connectionState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Connection timeout');
    }
  }
}

module.exports = ConnectMessagingSessionStep;
