const {TestUtils} = require('kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {OpenAppStep, AuthenticateUserStep, ClickStartLocalVideoButton, ClickStopLocalVideoButton, ClickUnbindVideoElementButton, ClickBindVideoElementButton} = require('./steps');
const {TileStateCheck} = require('./checks');

const { v4: uuidv4 } = require('uuid');

class VideoPinTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "TestAppVideoBinding");
  }

  async runIntegrationTest() {
    const attendeeID = uuidv4();
    const session = this.seleniumSessions[0];
    const useSimulcast = this.useSimulcast;
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendeeID, useSimulcast);
    await ClickStartLocalVideoButton.executeStep(this, session);
    await ClickPinVideoTileButton.executeStep(this, session, attendeeID);
    await VideoPreferenceCheck.executeStep(this, session, 'attendeeId', 'priority', 'targetSize');
    await this.waitAllSteps();
  }
}

module.exports = VideoPinTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoPinTest('Test App Video test', kiteConfig);
  await test.run();
})();
