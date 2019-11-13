const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickScreenShareButton, ClickScreenViewButton} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, ScreenViewingCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Key} = require('selenium-webdriver');
const uuidv4 = require('uuid/v4');

/**
 * Test screen viewing scenarios
 */
class ScreenViewingTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "ScreenViewing");
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

    await ClickScreenViewButton.executeStep(this, "OFF");
    await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_OFF', "ScreenViewingDisabledCheck");
    await ClickScreenViewButton.executeStep(this, "ON");
    await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_ON', "ScreenViewingEnabledAfterDisablingCheck");

    await this.waitAllSteps();
  }
}

module.exports = ScreenViewingTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new ScreenViewingTest('Screen viewing test', kiteConfig);
  await test.run();
})();
