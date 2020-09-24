const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class GetSipUriForCallStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, meetingId) {
    super(kiteBaseTest, sessionInfo);
    this.meetingId = meetingId;
  }

  static async executeStep(KiteBaseTest, sessionInfo, meetingId) {
    const step = new GetSipUriForCallStep(KiteBaseTest, sessionInfo, meetingId);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Making Sip Call';
  }

  metricName() {
    return 'GetSipUriForCall'
  }

  async run() {
    await this.page.switchToSipCallFlow();
    await this.page.authenticateSipCall(this.meetingId, this.test.payload.voiceConnectorId);
    let authState = await this.page.waitForSipAuthentication();
    if (authState === 'failed') {
      throw new KiteTestError(Status.BROKEN, 'Timeout while getting sip call uri');
    }
    let sipUri = await this.page.getSipUri();
    this.test.sipUri = sipUri;
  }
}

module.exports = GetSipUriForCallStep;
