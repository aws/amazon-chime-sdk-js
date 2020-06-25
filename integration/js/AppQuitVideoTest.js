const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, CloseAppStep} = require('./steps');
const {UserJoinedMeetingCheck, RemoteVideoCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

class AppQuitVideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "AppQuitVideoCheck");
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
    await ClickVideoButton.executeStep(this, monitorSession);
    await RemoteVideoCheck.executeStep(this, testSession, 'VIDEO_ON');
    await CloseAppStep.executeStep(this, monitorSession);
    await RemoteVideoCheck.executeStep(this, testSession, 'VIDEO_OFF');
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

    await test_window.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));

    await test_window.close();
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF'));

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

module.exports = AppQuitVideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AppQuitVideoTest('App quit video test', kiteConfig);
  await test.run();
})();
