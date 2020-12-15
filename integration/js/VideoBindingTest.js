const {TestUtils} = require('kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {OpenAppStep, AuthenticateUserStep, ClickStartLocalVideoButton, ClickStopLocalVideoButton, ClickUnbindVideoElementButton, ClickBindVideoElementButton} = require('./steps');
const {TileStateCheck} = require('./checks');

const { v4: uuidv4 } = require('uuid');

class VideoBindingTest extends SdkBaseTest {
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
    await ClickBindVideoElementButton.executeStep(this, session, '1', 'video-0');
    await TileStateCheck.executeStep(this, session, 'tile-1-state', 'boundVideoElementId', 'video-0');
    await ClickUnbindVideoElementButton.executeStep(this, session, '1');
    await TileStateCheck.executeStep(this, session, 'tile-1-state', 'boundVideoElementId', null);
    await ClickBindVideoElementButton.executeStep(this, session, '1', 'video-0');
    await TileStateCheck.executeStep(this, session, 'tile-1-state', 'boundVideoElementId', 'video-0');
    await ClickStopLocalVideoButton.executeStep(this, session);
    await this.waitAllSteps();
  }
}

module.exports = VideoBindingTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoBindingTest('Test App Video test', kiteConfig);
  await test.run();
})();
