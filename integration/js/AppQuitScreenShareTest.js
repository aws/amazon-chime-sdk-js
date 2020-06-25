const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickScreenShareButton, ClickScreenViewButton, CloseAppStep} = require('./steps');
const {UserJoinedMeetingCheck, ScreenViewingCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

class AppQuitScreenShareTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "AppQuitScreenShareCheck");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;

    if (this.numberOfSessions() > 1) {
      await this.runTestOnMultipleSessions()
    } else {
      await this.runTestOnSingleSessions()
    }
  }

  async runTestOnMultipleSessions() {
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const testSession = this.seleniumSessions[0];
    testSession.setSessionName("Test");
    const monitorSession = this.seleniumSessions[1];
    monitorSession.setSessionName("Monitor");

    await this.addUserToMeeting(test_attendee_id, testSession);
    await this.addUserToMeeting(monitor_attendee_id, monitorSession);
    await RosterCheck.executeStep(this, testSession, 2);
    await RosterCheck.executeStep(this, monitorSession, 2);
    await ClickScreenShareButton.executeStep(this, monitorSession, "ON");
    await ClickScreenViewButton.executeStep(this, monitorSession, "ON");
    await ScreenViewingCheck.executeStep(this, monitorSession, 'SCREEN_SHARING_ON', "ScreenShareEnabledCheck");

    await ClickScreenViewButton.executeStep(this, testSession, "ON");
    await ScreenViewingCheck.executeStep(this, testSession, 'SCREEN_SHARING_ON', "ScreenShareEnabledCheck");
    await CloseAppStep.executeStep(this, monitorSession);
    await ScreenViewingCheck.executeStep(this, testSession, 'SCREEN_SHARING_OFF', "ScreenShareDisabledCheck");


  }

  async runTestOnSingleSessions() {
    const session = this.seleniumSessions[0];
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(session.driver, "TEST");
    const monitor_window = await Window.openNew(session.driver, "MONITOR");

    await test_window.runCommands(async () => await this.addUserToMeeting(test_attendee_id, session));
    await monitor_window.runCommands(async () => await this.addUserToMeeting(monitor_attendee_id, session));

    await test_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    // turn on screen sharing on test client
    await test_window.runCommands(async () => await ClickScreenShareButton.executeStep(this, session, "ON"));
    // turn on screen viewing on monitor client
    await monitor_window.runCommands(async () => await ClickScreenViewButton.executeStep(this, session, "ON"));
    // Check if monitor is able to see the shared screen
    await monitor_window.runCommands(async () => await ScreenViewingCheck.executeStep(this, session, 'SCREEN_SHARING_ON', "ScreenShareEnabledCheck"));
    // Close test client
    await test_window.close();
    // Check if monitor is able to see the shared screen
    await monitor_window.runCommands(async () => await ScreenViewingCheck.executeStep(this, session, 'SCREEN_SHARING_OFF', "ScreenShareDisabledCheck"));

    await this.waitAllSteps();
  }


  async addUserToMeeting(attendee_id, sessionInfo) {
    await OpenAppStep.executeStep(this, sessionInfo);
    await AuthenticateUserStep.executeStep(this, sessionInfo, attendee_id);
    await UserAuthenticationCheck.executeStep(this, sessionInfo);
    await JoinMeetingStep.executeStep(this, sessionInfo);
    await UserJoinedMeetingCheck.executeStep(this, sessionInfo, attendee_id);
  }
}

module.exports = AppQuitScreenShareTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AppQuitScreenShareTest('App quit screen share test', kiteConfig);
  await test.run();
})();
