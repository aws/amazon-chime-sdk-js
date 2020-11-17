const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, ClickVideoFilterButton, WaitForRemoteVideoCheckToComplete, WaitForRemoteParticipantsToTurnVideoOff, WaitForRemoteParticipantsToTurnVideoOn, WaitForRemoteParticipantsToJoinMeeting, WaitForMeetingToBeCreated} = require('./steps');
const {UserJoinedMeetingCheck, LocalVideoCheck, RemoteVideoCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

class VideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Video");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    const useSimulcast = this.useSimulcast;
    const useVideoProcessor = this.useVideoProcessor;
    await WaitForMeetingToBeCreated.executeStep(this, session);
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, this.attendeeId, useSimulcast);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, this.attendeeId);
    await WaitForRemoteParticipantsToJoinMeeting.executeStep(this, session);
    await RosterCheck.executeStep(this, session, 2);
    if (useVideoProcessor) {
      await ClickVideoFilterButton.executeStep(this, session);
    }
    await ClickVideoButton.executeStep(this, session);
    await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON');
    await WaitForRemoteParticipantsToTurnVideoOn.executeStep(this, session);
    await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON');
    await WaitForRemoteVideoCheckToComplete.executeStep(this, session);
    await ClickVideoButton.executeStep(this, session);
    await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF');
    await WaitForRemoteParticipantsToTurnVideoOff.executeStep(this, session);
    await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF');
    await this.waitAllSteps();
  }
}

module.exports = VideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoTest('Video test', kiteConfig);
  await test.run();
})();
