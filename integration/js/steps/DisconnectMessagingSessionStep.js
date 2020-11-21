const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class DisconnectMessagingSessionStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new DisconnectMessagingSessionStep(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Disconnecting messaging session';
  }

  metricName() {
    return 'DisconnectMessagingSessionStep'
  }

  async run() {
    await this.page.disconnect();
    this.logger("Waiting to disconnection");
    let connectionState = await this.page.waitForDisconnection();
    if (connectionState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Disconnection timeout');
    }
  }
}

module.exports = DisconnectMessagingSessionStep;
