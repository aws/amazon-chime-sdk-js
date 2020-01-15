const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickScreenShareButton, ClickScreenViewButton} = require('./steps');
const {UserJoinedMeetingCheck, ScreenViewingCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const uuidv4 = require('uuid/v4');

class AppQuitScreenShareTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "AppQuitScreenShareCheck");
  }

  async runIntegrationTest() {
    this.url = this.baseUrl + '?m=' + uuidv4();
    this.numberOfParticipant = 2;
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(this.driver, "TEST");
    const monitor_window = await Window.openNew(this.driver, "MONITOR");

    await test_window.runCommands(async () => await this.addUserToMeeting(test_attendee_id));
    await monitor_window.runCommands(async () => await this.addUserToMeeting(monitor_attendee_id));

    await test_window.runCommands(async () => await RosterCheck.executeStep(this, 2));
    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, 2));

    // turn on screen sharing on test client
    await test_window.runCommands(async () => await ClickScreenShareButton.executeStep(this, "ON"));
    // turn on screen viewing on monitor client
    await monitor_window.runCommands(async () => await ClickScreenViewButton.executeStep(this, "ON"));
    // Check if monitor is able to see the shared screen
    await monitor_window.runCommands(async () => await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_ON', "ScreenShareEnabledCheck"));
    // Close test client
    await test_window.close();
    // Check if monitor is able to see the shared screen
    await monitor_window.runCommands(async () => await ScreenViewingCheck.executeStep(this, 'SCREEN_SHARING_OFF', "ScreenShareDisabledCheck"));

    await this.waitAllSteps();
  }

  async addUserToMeeting(attendee_id) {
    await OpenAppStep.executeStep(this);
    await AuthenticateUserStep.executeStep(this, attendee_id);
    await UserAuthenticationCheck.executeStep(this);
    await JoinMeetingStep.executeStep(this);
    await UserJoinedMeetingCheck.executeStep(this, attendee_id);
  }
}

module.exports = AppQuitScreenShareTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AppQuitScreenShareTest('App quit screen share test', kiteConfig);
  await test.run();
})();
