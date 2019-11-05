const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, LeaveMeetingStep} = require('./steps');
const {UserJoinedMeetingCheck, LocalVideoCheck, RemoteVideoCheck, UserAuthenticationCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const uuidv4 = require('uuid/v4');

class MeetingLeaveVideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "MeetingLeaveVideoCheck");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(this.driver, "TEST");
    const monitor_window = await Window.openNew(this.driver, "MONITOR");

    await test_window.runCommands(async () => await this.addUserToMeeting(test_attendee_id));
    await monitor_window.runCommands(async () => await this.addUserToMeeting(monitor_attendee_id));

    await test_window.runCommands(async () => await ClickVideoButton.executeStep(this));
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, 'VIDEO_ON'));


    await test_window.runCommands(async () => await LeaveMeetingStep.executeStep(this));
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

module.exports = MeetingLeaveVideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MeetingLeaveVideoTest('Meeting leave video test', kiteConfig);
  await test.run();
})();
