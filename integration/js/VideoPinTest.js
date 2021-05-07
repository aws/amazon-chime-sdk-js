const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {OpenAppStep, AuthenticateUserStep, ClickStartLocalVideoButton, ClickPinVideoTileButton, ClickUnpinVideoTileButton} = require('./steps');
const {VideoPreferenceCheck} = require('./checks');

const { v4: uuidv4 } = require('uuid');

class VideoPinTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "TestAppVideoBinding");
  }

  async runIntegrationTest() {
    const attendeeId = uuidv4();
    const session = this.seleniumSessions[0];
    const useSimulcast = this.useSimulcast;
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendeeId, useSimulcast);
    await ClickStartLocalVideoButton.executeStep(this, session);
    await ClickPinVideoTileButton.executeStep(this, session, attendeeId);
    await VideoPreferenceCheck.executeStep(this, session, attendeeId, 1, 2);
    await ClickUnpinVideoTileButton.executeStep(this, session, attendeeId);
    await VideoPreferenceCheck.executeStep(this, session, attendeeId, 2, 2);
    await this.waitAllSteps();
  }
}

module.exports = VideoPinTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoPinTest('Test App Video test', kiteConfig);
  await test.run();
})();
