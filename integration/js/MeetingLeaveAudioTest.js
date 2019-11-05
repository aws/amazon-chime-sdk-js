const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, PlayRandomToneStep, LeaveMeetingStep} = require('./steps');
const {UserJoinedMeetingCheck, LocalVideoCheck, RemoteAudioCheck, UserAuthenticationCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const uuidv4 = require('uuid/v4');

class MeetingLeaveAudioTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "MeetingLeaveAudioTest");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(this.driver, "TEST");
    const monitor_window = await Window.openNew(this.driver, "MONITOR");

    await test_window.runCommands(async () => await this.addUserToMeeting(test_attendee_id));
    await monitor_window.runCommands(async () => await this.addUserToMeeting(monitor_attendee_id));

    await test_window.runCommands(async () => await PlayRandomToneStep.executeStep(this));
    await monitor_window.runCommands(async () => await RemoteAudioCheck.executeStep(this, 'AUDIO_ON'));


    await test_window.runCommands(async () => await LeaveMeetingStep.executeStep(this));
    await monitor_window.runCommands(async () => await RemoteAudioCheck.executeStep(this, 'AUDIO_OFF'));

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

module.exports = MeetingLeaveAudioTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MeetingLeaveAudioTest('Meeting leave audio test', kiteConfig);
  await test.run();
})();
