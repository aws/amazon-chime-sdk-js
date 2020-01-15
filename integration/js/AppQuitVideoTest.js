const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, WaitForRemoteParticipantsToJoinMeeting} = require('./steps');
const {UserJoinedMeetingCheck, RemoteVideoCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const uuidv4 = require('uuid/v4');

class AppQuitVideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "AppQuitVideoCheck");
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

    await test_window.runCommands(async () => await ClickVideoButton.executeStep(this));
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, 'VIDEO_ON'));

    await test_window.close();
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, 'VIDEO_OFF'));

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

module.exports = AppQuitVideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AppQuitVideoTest('Meeting end video test', kiteConfig);
  await test.run();
})();
