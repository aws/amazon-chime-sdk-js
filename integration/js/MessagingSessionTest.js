const { TestUtils } = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { OpenMessagingSessionAppStep, ConnectMessagingSessionStep, DisconnectMessagingSessionStep } = require('./steps');
const { SessionEstablishedMessageCheck } = require('./checks');

class MessagingSessionTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "MessagingSessionTest");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    await OpenMessagingSessionAppStep.executeStep(this, session);
    await ConnectMessagingSessionStep.executeStep(this, session, this.userArn);
    await SessionEstablishedMessageCheck.executeStep(this, session, 'SESSION_ESTABLISHED')
    await DisconnectMessagingSessionStep.executeStep(this, session);
  }
}

module.exports = MessagingSessionTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MessagingSessionTest('Messaging session test', kiteConfig);
  await test.run();
})();
