const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, WaitForRemoteVideoCheckToComplete, WaitForRemoteParticipantsToTurnVideoOff, WaitForRemoteParticipantsToTurnVideoOn, WaitForRemoteParticipantsToJoinMeeting} = require('./steps');
const {UserJoinedMeetingCheck, LocalVideoCheck, RemoteVideoCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const uuidv4 = require('uuid/v4');

class VideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Video");
  }

  async runIntegrationTest() {
    this.page = new AppPage(this.driver);
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this);
    await AuthenticateUserStep.executeStep(this, attendee_id);
    await UserAuthenticationCheck.executeStep(this);
    await JoinMeetingStep.executeStep(this);
    await UserJoinedMeetingCheck.executeStep(this, attendee_id);
    await WaitForRemoteParticipantsToJoinMeeting.executeStep(this);
    await RosterCheck.executeStep(this, 2);
    await ClickVideoButton.executeStep(this);
    await LocalVideoCheck.executeStep(this, 'VIDEO_ON');
    await WaitForRemoteParticipantsToTurnVideoOn.executeStep(this);
    await RemoteVideoCheck.executeStep(this, 'VIDEO_ON');
    await WaitForRemoteVideoCheckToComplete.executeStep(this);
    await ClickVideoButton.executeStep(this);
    await LocalVideoCheck.executeStep(this, 'VIDEO_OFF');
    await WaitForRemoteParticipantsToTurnVideoOff.executeStep(this);
    await RemoteVideoCheck.executeStep(this, 'VIDEO_OFF');
    await this.waitAllSteps();
  }
}

module.exports = VideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoTest('Video test', kiteConfig);
  await test.run();
})();
