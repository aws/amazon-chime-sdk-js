const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickScreenShareButton, ClickScreenViewButton} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, ScreenViewingCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Key} = require('selenium-webdriver');
const { v4: uuidv4 } = require('uuid');

/**
 * Test screen viewing scenarios
 */
class ScreenViewingTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "ScreenViewing");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendee_id);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, attendee_id);

    await ClickScreenShareButton.executeStep(this, session, "ON");
    await ClickScreenViewButton.executeStep(this, session, "ON");
    await ScreenViewingCheck.executeStep(this, session, 'SCREEN_SHARING_ON', "ScreenSharingViewingEnabledCheck");

    await ClickScreenViewButton.executeStep(this, session, "OFF");
    await ScreenViewingCheck.executeStep(this, session, 'SCREEN_SHARING_OFF', "ScreenViewingDisabledCheck");
    await ClickScreenViewButton.executeStep(this, session, "ON");
    await ScreenViewingCheck.executeStep(this, session, 'SCREEN_SHARING_ON', "ScreenViewingEnabledAfterDisablingCheck");

    await this.waitAllSteps();
  }
}

module.exports = ScreenViewingTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new ScreenViewingTest('Screen viewing test', kiteConfig);
  await test.run();
})();
