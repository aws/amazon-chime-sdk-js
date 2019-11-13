const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickScreenShareButton, ClickScreenViewButton} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, ScreenViewingCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Key} = require('selenium-webdriver');
const uuidv4 = require('uuid/v4');

/**
 * Test screen sharing check
 * 1. Turn on screen sharing and viewing and check if screen is shared
 * 2. Turn off screen sharing and check if screen is shared
 * 3. Turn on screen sharing and check if screen is shared
 * 4. Turn off screen share and viewing, enable both again and check if screen is shared
 */
class ScreenSharingTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "ScreenSharing");
  }

  async runIntegrationTest() {
    this.page = new AppPage(this.driver);
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this);
    await AuthenticateUserStep.executeStep(this, attendee_id);
    await UserAuthenticationCheck.executeStep(this);
    await JoinMeetingStep.executeStep(this);
    await UserJoinedMeetingCheck.executeStep(this, attendee_id);

    await ClickScreenShareButton.executeStep(this, "ON");
    await ClickScreenViewButton.executeStep(this, "ON");
    await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_ON', "ScreenSharingViewingEnabledCheck");

    await ClickScreenShareButton.executeStep(this, "OFF");
    await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_OFF', "ScreenSharingDisabledCheck");
    await ClickScreenShareButton.executeStep(this, "ON");
    await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_ON', "ScreenSharingEnabledAfterDisablingCheck");

    await this.waitAllSteps();
  }
}

module.exports = ScreenSharingTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new ScreenSharingTest('Screen sharing test', kiteConfig);
  await test.run();
})();
